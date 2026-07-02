import { PRESTIGE, RAID_MIN, WIN_PRESTIGE } from '../config/rules';
import { networkMinFor } from './daimyo';
import { prestigeFromVassals } from './vassals';
import { appendLog } from './log';
import { GameState, PlayerId } from './types';

export function computePrestige(state: GameState, playerId: PlayerId): number {
  const forts = state.buildings.filter((b) => b.owner === playerId && b.type === 'fort').length;
  const castles = state.buildings.filter((b) => b.owner === playerId && b.type === 'castle').length;
  const player = state.players.find((p) => p.id === playerId)!;

  let points = forts * PRESTIGE.fort + castles * PRESTIGE.castle;
  if (hasStrongholdNetwork(state, playerId)) points += PRESTIGE.network;
  if (player.raids >= RAID_MIN) points += PRESTIGE.warMerit;

  points += prestigeFromVassals(player);

  return points;
}

// 自分の街道で連結された1つのネットワーク上に、自分の拠点(砦/城)が NETWORK_MIN 個以上
// 載っていれば true。「最長」ではなく「拠点をいくつ束ねたか」を評価する。
export function hasStrongholdNetwork(state: GameState, playerId: PlayerId): boolean {
  const player = state.players.find((p) => p.id === playerId)!;
  const minCount = networkMinFor(player);
  const adj = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    const xa = adj.get(a); if (xa) xa.push(b); else adj.set(a, [b]);
  };
  for (const r of state.roads) {
    if (r.owner !== playerId) continue;
    const [a, b] = state.board.edges[r.edgeId].vertexIds;
    link(a, b); link(b, a);
  }
  if (adj.size === 0) return false;

  const myStrongholds = new Set(
    state.buildings.filter((b) => b.owner === playerId).map((b) => b.vertexId)
  );

  const visited = new Set<number>();
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    let count = 0;
    const queue: number[] = [start];
    visited.add(start);
    while (queue.length > 0) {
      const v = queue.shift()!;
      if (myStrongholds.has(v)) count++;
      for (const n of adj.get(v) ?? []) {
        if (!visited.has(n)) { visited.add(n); queue.push(n); }
      }
    }
    if (count >= minCount) return true;
  }
  return false;
}

// 街道網の「到達度」＝自分の街道で連結された1成分に載る自分の拠点数の最大値。
// extraVid を渡すと、その頂点にも自分の拠点があると仮定して数える（AIの先読み用）。
// グラフ定義は hasStrongholdNetwork と同一。
//   networkStrongholdCount(state, pid) >= networkMinFor(player)  ⇔  hasStrongholdNetwork(state, pid)
// （hasStrongholdNetwork 側はリファクタせず現状維持）。
export function networkStrongholdCount(
  state: GameState,
  playerId: PlayerId,
  extraVid?: number,
): number {
  const adj = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    const xa = adj.get(a); if (xa) xa.push(b); else adj.set(a, [b]);
  };
  for (const r of state.roads) {
    if (r.owner !== playerId) continue;
    const [a, b] = state.board.edges[r.edgeId].vertexIds;
    link(a, b); link(b, a);
  }
  if (adj.size === 0) return 0;

  const myStrongholds = new Set(
    state.buildings.filter((b) => b.owner === playerId).map((b) => b.vertexId)
  );
  if (extraVid !== undefined) myStrongholds.add(extraVid);

  let best = 0;
  const visited = new Set<number>();
  for (const start of adj.keys()) {
    if (visited.has(start)) continue;
    let count = 0;
    const queue: number[] = [start];
    visited.add(start);
    while (queue.length > 0) {
      const v = queue.shift()!;
      if (myStrongholds.has(v)) count++;
      for (const n of adj.get(v) ?? []) {
        if (!visited.has(n)) { visited.add(n); queue.push(n); }
      }
    }
    if (count > best) best = count;
  }
  return best;
}

export function checkWin(state: GameState): GameState {
  const points = computePrestige(state, state.currentPlayer);
  if (points >= WIN_PRESTIGE) {
    const name = state.players.find((p) => p.id === state.currentPlayer)?.name ?? '';
    return appendLog({ ...state, winner: state.currentPlayer, phase: 'gameOver', screen: 'result' }, `${name}が勝利しました`);
  }
  return state;
}

export function recomputeAfterBuild(state: GameState): GameState {
  return checkWin(state);
}
