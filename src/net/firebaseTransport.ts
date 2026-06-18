import { db } from './firebaseClient';
import { ref, onValue, onChildAdded, set, push, remove, onDisconnect } from 'firebase/database';
import type { NetTransport } from './transport';

// RTDB は値が null のキー、および空配列([])・空オブジェクト({})のキーを書き込み時に
// 削除してしまう。GameState には null を取り得るフィールド（dice/winner/
// setup.pendingRoadFromVertex 等）に加え、空配列になりやすいフィールド（buildings/
// roads/player.cards/discardQueue 等、対局開始直後はほぼ全て空）が多数あるため、
// そのまま送ると読み戻し時にキーが消えて undefined になり、呼び出し側の
// `=== null` 判定や `.filter()` 等が壊れる。送信前にこれらをセンチネル値へ変換し、
// 受信時に元へ戻すことで、この RTDB 固有の挙動をこのファイル内に閉じ込める。
const NULL_SENTINEL = '__rtdb_null__';
const EMPTY_ARRAY_SENTINEL = '__rtdb_empty_array__';
const EMPTY_OBJECT_SENTINEL = '__rtdb_empty_object__';

function encodeForRtdb(value: unknown): unknown {
  if (value === null) return NULL_SENTINEL;
  if (Array.isArray(value)) {
    if (value.length === 0) return EMPTY_ARRAY_SENTINEL;
    return value.map(encodeForRtdb);
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return EMPTY_OBJECT_SENTINEL;
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) out[k] = encodeForRtdb(v);
    return out;
  }
  return value;
}

function decodeFromRtdb(value: unknown): unknown {
  if (value === NULL_SENTINEL) return null;
  if (value === EMPTY_ARRAY_SENTINEL) return [];
  if (value === EMPTY_OBJECT_SENTINEL) return {};
  if (Array.isArray(value)) return value.map(decodeFromRtdb);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = decodeFromRtdb(v);
    return out;
  }
  return value;
}

export function createFirebaseTransport(): NetTransport {
  let code = '';
  let selfKey = '';
  const unsubs: Array<() => void> = [];

  return {
    async join(roomCode, self, h) {
      code = roomCode; selfKey = self.key;
      h.onStatus('connecting');
      const base = `rooms/${code}`;

      // 接続状態（RTDB の特殊パス）
      unsubs.push(onValue(ref(db, '.info/connected'), (snap) => {
        h.onStatus(snap.val() ? 'connected' : 'disconnected');
      }));
      // state（snapshot）: アタッチ時に最新値を即時通知 → 後から参加したゲストも自動で追いつく
      unsubs.push(onValue(ref(db, `${base}/state`), (snap) => {
        if (snap.exists()) h.onMessage('snapshot', decodeFromRtdb(snap.val()));
      }));
      // lobby
      unsubs.push(onValue(ref(db, `${base}/lobby`), (snap) => {
        if (snap.exists()) h.onMessage('lobby', decodeFromRtdb(snap.val()));
      }));
      // intents: 受信したら必ず remove して消費（再発火・蓄積を防ぐ）
      unsubs.push(onChildAdded(ref(db, `${base}/intents`), (snap) => {
        h.onMessage('intent', decodeFromRtdb(snap.val()));
        remove(snap.ref);
      }));
      // presence（key → meta のマップをそのまま渡す。name/role をホスト側の席割りに使う）
      unsubs.push(onValue(ref(db, `${base}/presence`), (snap) => {
        h.onPresenceChange(snap.val() ?? {});
      }));
      const selfRef = ref(db, `${base}/presence/${selfKey}`);
      await set(selfRef, self.meta ?? {});
      onDisconnect(selfRef).remove();
    },

    async send(event, payload) {
      const base = `rooms/${code}`;
      // RTDB は undefined を書けないため JSON 経由で除去し、null はセンチネル化して保持する。
      const clean = encodeForRtdb(JSON.parse(JSON.stringify(payload)));
      if (event === 'snapshot') await set(ref(db, `${base}/state`), clean);
      else if (event === 'lobby') await set(ref(db, `${base}/lobby`), clean);
      else if (event === 'intent') await push(ref(db, `${base}/intents`), clean);
    },

    async leave() {
      unsubs.forEach((u) => u());
      unsubs.length = 0;
      if (code && selfKey) await remove(ref(db, `rooms/${code}/presence/${selfKey}`));
    },
  };
}
