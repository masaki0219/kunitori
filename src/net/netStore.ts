import { create } from 'zustand';
import { useGameStore } from '../store/gameStore';
import { createFirebaseTransport, roomSnapshotExists, deleteRoom } from './firebaseTransport';
import type { NetTransport } from './transport';
import { applyIntentOnHost, validateIntent } from './intent';
import { toSnapshotState } from './snapshot';
import {
  EV, IntentMessageSchema, SnapshotMessageSchema, LobbyMessageSchema, StampMessageSchema,
  type Intent, type Member, type Role, type Seat, type NetStatus,
} from './messages';
import { newId } from './ids';
import { generateRoomCode, normalizeRoomCode } from './roomCode';
import { emptyResources } from '../game/resources';
import { saveHostSession, loadHostSession, clearHostSession, type HostSession } from './sessionPersist';

interface NetState {
  mode: 'local' | 'online';
  role: Role | null;
  mySeat: Seat | null;
  roomCode: string | null;
  status: NetStatus;
  members: Member[];
  lastStamp: { seat: Seat; stampId: string; msgId: string } | null;

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
  sendStamp: (stampId: string) => void;        // 揮発的スタンプを全員へ送る
  leaveRoom: () => void;
  hostResumeRoom: (roomCode: string, hostName: string) => Promise<void>; // ホストのプロセス断からの復帰
  checkResumableSession: () => Promise<HostSession | null>;              // 復帰可能なセッションが残っているか

  // 内部ヘルパー（ホスト用）
  _hostBroadcastLobby: () => void;
  _hostRebroadcastSnapshot: () => void;
  _hostHandlePresence: (present: Record<string, Partial<Member>>) => void;

  // 公開API
  isAutoPlayedSeat: (seat: Seat) => boolean;
}

export const useNetStore = create<NetState>((set, get) => ({
  mode: 'local',
  role: null, mySeat: null, roomCode: null, status: 'idle', members: [],
  lastStamp: null,
  _transport: null, _rev: 0, _seenMsgIds: new Set(), _unsubscribeStore: null,

  // --- ローカル1台対戦（従来動作） ---
  startLocal: () => set({ mode: 'local', role: null, mySeat: null, roomCode: null }),

  // --- ホスト: 部屋を作る ---
  hostCreateRoom: async (hostName) => {
    const code = generateRoomCode();
    const transport = createFirebaseTransport();
    const me: Member = { seat: 0, name: hostName, role: 'host', isAI: false, online: true, _presenceKey: 'seat-0' };
    set({ mode: 'online', role: 'host', mySeat: 0, roomCode: code,
          members: [me], _transport: transport, _rev: 0, _seenMsgIds: new Set() });

    await transport.join(code, { key: 'seat-0', meta: { seat: 0, name: hostName, role: 'host' } }, {
      onStatus: (st) => set({ status: st }),
      onPresenceChange: (present) => get()._hostHandlePresence(present),
      onMessage: (event, payload) => {
        if (event === EV.stamp) {                     // スタンプは host/guest 共通で受ける
          const p = StampMessageSchema.safeParse(payload);
          if (p.success) set({ lastStamp: { seat: p.data.fromSeat, stampId: p.data.stampId, msgId: p.data.msgId } });
          return;
        }
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
          // resources が欠けた player が紛れ込んでいたら補完する（過去に発生した不具合への保険）
          const incoming = p.data.state as any;
          if (Array.isArray(incoming.players)) {
            incoming.players = incoming.players.map((pl: any) =>
              pl && !pl.resources ? { ...pl, resources: emptyResources() } : pl
            );
          }
          // ★重要: replace=true を使わない（アクション関数を消さないため）。マージで適用。
          useGameStore.setState(incoming);
        } else if (event === EV.stamp) {
          const p = StampMessageSchema.safeParse(payload);
          if (p.success) set({ lastStamp: { seat: p.data.fromSeat, stampId: p.data.stampId, msgId: p.data.msgId } });
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
      if (store.screen === 'result') clearHostSession();
    });
    set({ _unsubscribeStore: unsub });
    // 2) members（seat昇順）から players を構築して開始
    const players = [...s.members].sort((a, b) => a.seat - b.seat)
      .map((m) => ({ name: m.name, isAI: m.isAI }));
    useGameStore.getState().startGame({ players });
    // startGame で screen='game' になり、購読経由で snapshot がゲストへ届く
    const hostName = s.members.find((m) => m.role === 'host')?.name ?? '大名';
    saveHostSession({ roomCode: s.roomCode!, hostName });
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

  sendStamp: (stampId) => {
    const s = get();
    if (s.mode !== 'online' || !s._transport || s.mySeat == null) return;
    s._transport.send(EV.stamp, { msgId: newId(), fromSeat: s.mySeat, stampId });
  },

  leaveRoom: () => {
    const s = get();
    // ホストが抜けるときは部屋ごと掃除する(ロビー放棄・対局終了後の離脱を確定的にクリーンアップ)。
    // ゲストの離脱では削除しない(既存の presence remove のみ)。
    if (s.role === 'host' && s.roomCode) {
      deleteRoom(s.roomCode);  // 投げっぱなし。UI 遷移は待たせない。
    }
    s._unsubscribeStore?.();
    s._transport?.leave();
    clearHostSession();
    set({ mode: 'local', role: null, mySeat: null, roomCode: null,
          status: 'idle', members: [], _transport: null, _unsubscribeStore: null });
  },

  // --- ホスト: プロセス断からの復帰 ---
  hostResumeRoom: async (roomCode, hostName) => {
    const transport = createFirebaseTransport();
    set({ mode: 'online', role: 'host', mySeat: 0, roomCode,
          members: [], _transport: transport, _rev: 0, _seenMsgIds: new Set() });

    let resumed = false;
    await transport.join(roomCode, { key: 'seat-0', meta: { seat: 0, name: hostName, role: 'host' } }, {
      onStatus: (st) => set({ status: st }),
      onPresenceChange: (present) => get()._hostHandlePresence(present),
      onMessage: (event, payload) => {
        if (event === EV.stamp) {
          const p = StampMessageSchema.safeParse(payload);
          if (p.success) set({ lastStamp: { seat: p.data.fromSeat, stampId: p.data.stampId, msgId: p.data.msgId } });
          return;
        }
        // 復帰直後の一度だけ、RTDB に残る最新 snapshot を取り込む（以後の自己発信分は既存hostと同じく無視）
        if (!resumed && event === EV.snapshot) {
          const p = SnapshotMessageSchema.safeParse(payload);
          if (!p.success) return;
          resumed = true;
          set({ _rev: p.data.rev });
          const incoming = p.data.state as any;
          if (Array.isArray(incoming.players)) {
            incoming.players = incoming.players.map((pl: any) =>
              pl && !pl.resources ? { ...pl, resources: emptyResources() } : pl
            );
          }
          useGameStore.setState(incoming); // マージ復元（ゲスト経路と同じ）
          // members を state.players から再構築（seat=i, 名前/isAI を引き継ぐ。_presenceKey は再接続で埋まる）
          const members: Member[] = (incoming.players as any[]).map((pl, i) => ({
            seat: i,
            name: pl.name,
            role: i === 0 ? 'host' : 'guest',
            isAI: !!pl.isAI,
            online: i === 0,
            _presenceKey: i === 0 ? 'seat-0' : undefined,
          }));
          set({ members });
          // ここで startOnlineGame と同じ store 購読を張る（以後のホスト操作が配信される）
          const unsub = useGameStore.subscribe((store) => {
            const st = get();
            if (st.role !== 'host' || !st._transport) return;
            const rev = st._rev + 1;
            set({ _rev: rev });
            st._transport.send(EV.snapshot, { rev, state: toSnapshotState(store as any) });
            if (store.screen === 'result') clearHostSession();
          });
          set({ _unsubscribeStore: unsub });
          return;
        }
        if (event !== EV.intent) return;
        const parsed = IntentMessageSchema.safeParse(payload);
        if (!parsed.success) return;
        const { msgId, fromSeat, intent } = parsed.data;
        if (get()._seenMsgIds.has(msgId)) return;
        get()._seenMsgIds.add(msgId);
        const state = toSnapshotState(useGameStore.getState());
        if (!validateIntent(state, intent as Intent, fromSeat)) return;
        applyIntentOnHost(intent as Intent);
      },
    });
    saveHostSession({ roomCode, hostName });
  },

  checkResumableSession: async () => {
    const session = await loadHostSession();
    if (!session) return null;
    try {
      if (await roomSnapshotExists(session.roomCode)) return session;
    } catch {
      return null; // 接続不能時は判断できないため復帰導線を出さない
    }
    await clearHostSession(); // 残骸（期限切れ）は破棄
    return null;
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
  _hostHandlePresence: (present) => {
    // 開始前（ロビー中）に限り、未割り当てのゲスト（pending-*）へ新しい席を割り当てる。
    // 対局開始後は既存の席構成を変えない代わりに、名前一致での再バインドを試みる（フェーズ2）。
    const inLobby = useGameStore.getState().screen === 'lobby';
    set((s) => {
      // online フラグ更新: host は常に online、AI は presence を持たないため不変、
      // ゲストは自分の _presenceKey が present に含まれているかで判定。
      let members = s.members.map((m) => {
        if (m.role === 'host') return { ...m, online: true };
        if (m.isAI) return m;
        return m._presenceKey ? { ...m, online: m._presenceKey in present } : m;
      });

      if (inLobby) {
        const assignedKeys = new Set(members.map((m) => m._presenceKey).filter(Boolean));
        for (const [key, meta] of Object.entries(present)) {
          if (!key.startsWith('pending-')) continue;     // ホスト自身やAIは対象外
          if (assignedKeys.has(key)) continue;            // 既に席がある
          if ((meta as Partial<Member>)?.role !== 'guest') continue;
          const seat = members.length;
          members = [...members, {
            seat,
            name: (meta as Partial<Member>)?.name || `プレイヤー${seat + 1}`,
            role: 'guest',
            isAI: false,
            online: true,
            _presenceKey: key,
          }];
          assignedKeys.add(key);
        }
      } else {
        // 対局中: 既存のオフライン人間席を、名前一致する未使用 pending-* キーへ再バインド
        const boundKeys = new Set(members.map((m) => m._presenceKey).filter(Boolean));
        members = members.map((m) => {
          if (m.role === 'host' || m.isAI || m.online) return m; // 対象は「人間・オフライン」のみ
          const hit = Object.entries(present).find(([key, meta]) =>
            key.startsWith('pending-') &&
            !boundKeys.has(key) &&
            (meta as Partial<Member>)?.name === m.name
          );
          if (!hit) return m;
          boundKeys.add(hit[0]);
          return { ...m, _presenceKey: hit[0], online: true };
        });
      }

      return { members };
    });
    get()._hostBroadcastLobby();
    get()._hostRebroadcastSnapshot();
  },

  // ホストのみ true を返す。指定席が「人間 かつ 現在オフライン」なら代行対象。
  // host席(seat0)は常に online=true、AI席は isAI=true なので自然に除外される。
  isAutoPlayedSeat: (seat) => {
    const s = get();
    if (s.mode !== 'online' || s.role !== 'host') return false;
    const m = s.members.find((mm) => mm.seat === seat);
    if (!m) return false;
    return !m.isAI && !m.online;
  },
}));
