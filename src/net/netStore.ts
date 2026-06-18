import { create } from 'zustand';
import { useGameStore } from '../store/gameStore';
import { createFirebaseTransport } from './firebaseTransport';
import type { NetTransport } from './transport';
import { applyIntentOnHost, validateIntent } from './intent';
import { toSnapshotState } from './snapshot';
import {
  EV, IntentMessageSchema, SnapshotMessageSchema, LobbyMessageSchema,
  type Intent, type Member, type Role, type Seat, type NetStatus,
} from './messages';
import { newId } from './ids';

interface NetState {
  mode: 'local' | 'online';
  role: Role | null;
  mySeat: Seat | null;
  roomCode: string | null;
  status: NetStatus;
  members: Member[];

  // 内部用
  _transport: NetTransport | null;
  _rev: number;                 // ホスト: 配信した最新 rev / ゲスト: 適用済み最新 rev
  _seenMsgIds: Set<string>;     // ホスト: 重複 intent 排除
  _unsubscribeStore: (() => void) | null; // ホスト: 状態購読の解除関数

  // 公開API
  startLocal: () => void;
  hostCreateRoom: (hostName: string) => Promise<void>;
  guestJoinRoom: (code: string, name: string) => Promise<void>;
  addAISeat: (name: string) => void;          // ホストがロビーでAI席を足す
  startOnlineGame: () => void;                 // ホストが対局開始
  dispatch: (intent: Intent) => void;          // UIからの操作はすべてこれを通す
  leaveRoom: () => void;

  // 内部ヘルパー（ホスト用）
  _hostBroadcastLobby: () => void;
  _hostRebroadcastSnapshot: () => void;
}

export const useNetStore = create<NetState>((set, get) => ({
  mode: 'local',
  role: null, mySeat: null, roomCode: null, status: 'idle', members: [],
  _transport: null, _rev: 0, _seenMsgIds: new Set(), _unsubscribeStore: null,

  // --- ローカル1台対戦（従来動作） ---
  startLocal: () => set({ mode: 'local', role: null, mySeat: null, roomCode: null }),

  // --- ホスト: 部屋を作る ---
  hostCreateRoom: async (hostName) => {
    const { generateRoomCode } = await import('./roomCode');
    const code = generateRoomCode();
    const transport = createFirebaseTransport();
    const me: Member = { seat: 0, name: hostName, role: 'host', isAI: false, online: true };
    set({ mode: 'online', role: 'host', mySeat: 0, roomCode: code,
          members: [me], _transport: transport, _rev: 0, _seenMsgIds: new Set() });

    await transport.join(code, { key: 'seat-0', meta: { seat: 0, name: hostName, role: 'host' } }, {
      onStatus: (st) => set({ status: st }),
      onPresenceChange: (keys) => {
        // online フラグ更新 ＋ 途中参加者へ現状を再配信
        set((s) => ({ members: s.members.map((m) => ({ ...m, online: keys.includes(`seat-${m.seat}`) || m.role === 'host' })) }));
        get()._hostBroadcastLobby();
        get()._hostRebroadcastSnapshot();
      },
      onMessage: (event, payload) => {
        if (event !== EV.intent) return;              // ホストは intent だけ処理
        const parsed = IntentMessageSchema.safeParse(payload);
        if (!parsed.success) return;
        const { msgId, fromSeat, intent } = parsed.data;
        if (get()._seenMsgIds.has(msgId)) return;     // 重複排除
        get()._seenMsgIds.add(msgId);
        const state = toSnapshotState(useGameStore.getState());
        if (!validateIntent(state, intent as Intent, fromSeat)) return; // 不正は捨てる
        applyIntentOnHost(intent as Intent);          // 実行 → 状態購読が snapshot を配信
      },
    });
  },

  // --- ゲスト: 部屋に参加 ---
  guestJoinRoom: async (code, name) => {
    const { normalizeRoomCode } = await import('./roomCode');
    const room = normalizeRoomCode(code);
    const transport = createFirebaseTransport();
    set({ mode: 'online', role: 'guest', mySeat: null, roomCode: room,
          members: [], _transport: transport, _rev: 0 });

    // 仮キーで参加 → ホストがロビーで席を割り振る（_assignSeat）
    const tempKey = `pending-${newId()}`;
    await transport.join(room, { key: tempKey, meta: { name, role: 'guest' } }, {
      onStatus: (st) => set({ status: st }),
      onPresenceChange: () => { /* ゲストは members を lobby メッセージで受け取る */ },
      onMessage: (event, payload) => {
        if (event === EV.lobby) {
          const p = LobbyMessageSchema.safeParse(payload);
          if (!p.success) return;
          set({ members: p.data.members as Member[] });
          // 自分の席を名前一致で確定（簡易）。確定済みなら維持。
          if (get().mySeat == null) {
            const mine = p.data.members.find((m) => m.role === 'guest' && m.name === name);
            if (mine) set({ mySeat: mine.seat });
          }
        } else if (event === EV.snapshot) {
          const p = SnapshotMessageSchema.safeParse(payload);
          if (!p.success) return;
          if (p.data.rev <= get()._rev) return;       // 古い/重複は無視
          set({ _rev: p.data.rev });
          // ★重要: replace=true を使わない（アクション関数を消さないため）。マージで適用。
          useGameStore.setState(p.data.state as any);
        }
      },
    });
  },

  addAISeat: (name) => {
    const s = get();
    if (s.role !== 'host') return;
    const seat = s.members.length;
    set({ members: [...s.members, { seat, name, role: 'guest', isAI: true, online: true }] });
    get()._hostBroadcastLobby();
  },

  // --- ホスト: 対局開始 ---
  startOnlineGame: () => {
    const s = get();
    if (s.role !== 'host') return;
    // 1) 先に状態購読を有効化（初期状態も配信されるように）
    const unsub = useGameStore.subscribe((store) => {
      const st = get();
      if (st.role !== 'host' || !st._transport) return;
      const rev = st._rev + 1;
      set({ _rev: rev });
      st._transport.send(EV.snapshot, { rev, state: toSnapshotState(store as any) });
    });
    set({ _unsubscribeStore: unsub });
    // 2) members（seat昇順）から players を構築して開始
    const players = [...s.members].sort((a, b) => a.seat - b.seat)
      .map((m) => ({ name: m.name, isAI: m.isAI }));
    useGameStore.getState().startGame({ players });
    // startGame で screen='game' になり、購読経由で snapshot がゲストへ届く
  },

  // --- UIの全操作はここを通す ---
  dispatch: (intent) => {
    const s = get();
    if (s.mode === 'local') {            // 従来通り直接実行
      applyIntentOnHost(intent);
      return;
    }
    if (s.role === 'host') {             // ホストはローカル実行（購読が配信）
      const state = toSnapshotState(useGameStore.getState());
      if (validateIntent(state, intent, s.mySeat ?? -1)) applyIntentOnHost(intent);
      return;
    }
    // ゲスト: intent を送るだけ
    if (s._transport && s.mySeat != null) {
      s._transport.send(EV.intent, { msgId: newId(), fromSeat: s.mySeat, intent });
    }
  },

  leaveRoom: () => {
    const s = get();
    s._unsubscribeStore?.();
    s._transport?.leave();
    set({ mode: 'local', role: null, mySeat: null, roomCode: null,
          status: 'idle', members: [], _transport: null, _unsubscribeStore: null });
  },

  // --- 内部ヘルパー（ホスト用） ---
  _hostBroadcastLobby: () => {
    const s = get();
    if (s.role !== 'host' || !s._transport) return;
    s._transport.send(EV.lobby, { members: s.members, started: false });
  },
  _hostRebroadcastSnapshot: () => {
    const s = get();
    if (s.role !== 'host' || !s._transport) return;
    const store = useGameStore.getState();
    if (store.screen !== 'game' && store.screen !== 'result') return;
    s._transport.send(EV.snapshot, { rev: s._rev, state: toSnapshotState(store) });
  },
}));
