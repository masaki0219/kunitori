import { db } from './firebaseClient';
import { ref, onValue, onChildAdded, set, push, remove, onDisconnect } from 'firebase/database';
import type { NetTransport } from './transport';

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
        if (snap.exists()) h.onMessage('snapshot', snap.val());
      }));
      // lobby
      unsubs.push(onValue(ref(db, `${base}/lobby`), (snap) => {
        if (snap.exists()) h.onMessage('lobby', snap.val());
      }));
      // intents: 受信したら必ず remove して消費（再発火・蓄積を防ぐ）
      unsubs.push(onChildAdded(ref(db, `${base}/intents`), (snap) => {
        h.onMessage('intent', snap.val());
        remove(snap.ref);
      }));
      // presence
      unsubs.push(onValue(ref(db, `${base}/presence`), (snap) => {
        h.onPresenceChange(Object.keys(snap.val() ?? {}));
      }));
      const selfRef = ref(db, `${base}/presence/${selfKey}`);
      await set(selfRef, self.meta ?? {});
      onDisconnect(selfRef).remove();
    },

    async send(event, payload) {
      const base = `rooms/${code}`;
      const clean = JSON.parse(JSON.stringify(payload)); // RTDB は undefined を書けないため除去
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
