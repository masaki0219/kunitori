import { LARGEST_ARMY_MIN, LONGEST_ROAD_MIN, POINTS, WIN_POINTS } from '../config/rules';
import { GameState, PlayerId } from './types';

export function computePoints(state: GameState, playerId: PlayerId): number {
  const forts = state.buildings.filter((b) => b.owner === playerId && b.type === 'fort').length;
  const castles = state.buildings.filter((b) => b.owner === playerId && b.type === 'castle').length;
  const player = state.players.find((p) => p.id === playerId)!;

  let points = forts * POINTS.fort + castles * POINTS.castle;
  if (state.longestRoadHolder === playerId) points += POINTS.longestRoad;
  if (state.largestArmyHolder === playerId) points += POINTS.largestArmy;

  const merits = player.cards.filter((c) => c === 'merit').length;
  points += merits * POINTS.merit;

  return points;
}

// 対象プレイヤーの road グラフ上で、頂点に他プレイヤーの建物がある場合はそこで分断しつつ、
// 同じ辺を二度通らない最長trailをDFSで探索する。
export function longestTrailForPlayer(state: GameState, playerId: PlayerId): number {
  const playerEdges = state.roads.filter((r) => r.owner === playerId);
  if (playerEdges.length === 0) return 0;

  // vertexId -> [{edgeId, otherVertexId}]
  const adjacency = new Map<number, { edgeId: number; other: number }[]>();
  for (const r of playerEdges) {
    const edge = state.board.edges[r.edgeId];
    const [a, b] = edge.vertexIds;
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push({ edgeId: r.edgeId, other: b });
    adjacency.get(b)!.push({ edgeId: r.edgeId, other: a });
  }

  const blockedVertex = (vertexId: number): boolean => {
    const b = state.buildings.find((bb) => bb.vertexId === vertexId);
    return !!b && b.owner !== playerId;
  };

  let best = 0;

  function dfs(vertex: number, usedEdges: Set<number>, length: number) {
    best = Math.max(best, length);
    const neighbors = adjacency.get(vertex) ?? [];
    for (const n of neighbors) {
      if (usedEdges.has(n.edgeId)) continue;
      if (length > 0 && blockedVertex(vertex)) continue; // 分断: 他人の建物を越えて進めない
      usedEdges.add(n.edgeId);
      dfs(n.other, usedEdges, length + 1);
      usedEdges.delete(n.edgeId);
    }
  }

  for (const startVertex of adjacency.keys()) {
    dfs(startVertex, new Set<number>(), 0);
  }

  return best;
}

export function updateLongestRoad(state: GameState): GameState {
  const lengths = new Map<PlayerId, number>();
  for (const p of state.players) {
    lengths.set(p.id, longestTrailForPlayer(state, p.id));
  }

  const currentHolder = state.longestRoadHolder;
  const currentLength = currentHolder !== null ? (lengths.get(currentHolder) ?? 0) : 0;

  let bestPlayer = currentHolder;
  let bestLength = currentHolder !== null ? currentLength : 0;

  for (const p of state.players) {
    const len = lengths.get(p.id) ?? 0;
    if (len >= LONGEST_ROAD_MIN && len > bestLength) {
      bestLength = len;
      bestPlayer = p.id;
    }
  }

  if (currentHolder !== null && (lengths.get(currentHolder) ?? 0) < LONGEST_ROAD_MIN) {
    // 現保持者が基準未満に落ちることは通常ないが、念のため再評価
    bestPlayer = null;
    bestLength = 0;
    for (const p of state.players) {
      const len = lengths.get(p.id) ?? 0;
      if (len >= LONGEST_ROAD_MIN && len > bestLength) {
        bestLength = len;
        bestPlayer = p.id;
      }
    }
  }

  return { ...state, longestRoadHolder: bestPlayer };
}

export function updateLargestArmy(state: GameState): GameState {
  const currentHolder = state.largestArmyHolder;
  const currentCount = currentHolder !== null
    ? state.players.find((p) => p.id === currentHolder)!.playedWarlords
    : 0;

  let bestPlayer = currentHolder;
  let bestCount = currentHolder !== null ? currentCount : 0;

  for (const p of state.players) {
    if (p.playedWarlords >= LARGEST_ARMY_MIN && p.playedWarlords > bestCount) {
      bestCount = p.playedWarlords;
      bestPlayer = p.id;
    }
  }

  return { ...state, largestArmyHolder: bestPlayer };
}

export function checkWin(state: GameState): GameState {
  const points = computePoints(state, state.currentPlayer);
  if (points >= WIN_POINTS) {
    return { ...state, winner: state.currentPlayer, phase: 'gameOver', screen: 'result' };
  }
  return state;
}

export function recomputeAfterBuild(state: GameState): GameState {
  let next = updateLongestRoad(state);
  next = updateLargestArmy(next);
  next = checkWin(next);
  return next;
}
