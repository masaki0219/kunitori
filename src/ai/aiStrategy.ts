import { networkMinFor } from '../game/daimyo';
import { networkStrongholdCount } from '../game/scoring';
import { isValidSetupFort, terrainResource } from '../game/setup';
import { GameState, PlayerId, ResourceType } from '../game/types';

const ALL_RESOURCES: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

const NEW_RESOURCE_BONUS = 3;
const PORT_BONUS = 2;
const DISTANCE_PENALTY = 1.5;

// 街道網(+2点)への誘導。完成手は大きく、途中の1歩は控えめに。
// 目安：COMPLETE は PORT_BONUS の2〜3倍（網成立=威信+2で港より価値が高い）、STEP はその1/4程度。
// 値は sim で微調整する。
const NETWORK_COMPLETE_BONUS = 10;
const NETWORK_STEP_BONUS = 3;

function tokenWeight(token: number | null): number {
  if (token === null) return 0;
  return 6 - Math.abs(7 - token);
}

export function scoreVertex(state: GameState, vertexId: number): number {
  const vertex = state.board.vertices[vertexId];
  let score = 0;
  const terrains = new Set<string>();
  for (const hexId of vertex.hexIds) {
    const hex = state.board.hexes.find((h) => h.id === hexId)!;
    if (hex.id === state.banditHexId) continue;
    score += tokenWeight(hex.token);
    if (hex.token !== null) terrains.add(hex.terrain);
  }
  if (terrains.size === 3) score += 2;
  else if (terrains.size === 2) score += 1;
  return score;
}

export function networkVertices(state: GameState, playerId: PlayerId): Set<number> {
  const set = new Set<number>();
  for (const b of state.buildings) if (b.owner === playerId) set.add(b.vertexId);
  for (const r of state.roads) {
    if (r.owner !== playerId) continue;
    const e = state.board.edges[r.edgeId];
    set.add(e.vertexIds[0]);
    set.add(e.vertexIds[1]);
  }
  return set;
}

function occupiedByOpponent(state: GameState, vid: number, playerId: PlayerId): boolean {
  return state.buildings.some((b) => b.vertexId === vid && b.owner !== playerId);
}

export function coveredResources(state: GameState, playerId: PlayerId): Set<ResourceType> {
  const have = new Set<ResourceType>();
  for (const b of state.buildings) {
    if (b.owner !== playerId) continue;
    const v = state.board.vertices[b.vertexId];
    for (const hid of v.hexIds) {
      const hex = state.board.hexes.find((h) => h.id === hid)!;
      const r = terrainResource(hex.terrain);
      if (r) have.add(r);
    }
  }
  return have;
}

function isPortVertex(state: GameState, vid: number): boolean {
  return state.board.ports.some((p) => p.vertexIds.includes(vid));
}

export function evalTargetVertex(state: GameState, playerId: PlayerId, vid: number): number {
  let s = scoreVertex(state, vid);
  const have = coveredResources(state, playerId);
  const v = state.board.vertices[vid];
  const newResources = new Set<ResourceType>();
  for (const hid of v.hexIds) {
    const hex = state.board.hexes.find((h) => h.id === hid)!;
    const r = terrainResource(hex.terrain);
    if (r && !have.has(r)) newResources.add(r);
  }
  s += newResources.size * NEW_RESOURCE_BONUS;
  if (isPortVertex(state, vid)) s += PORT_BONUS;
  return s;
}

export interface RoadTarget {
  vertexId: number;
  firstEdge: number;
  dist: number;
  value: number;
}

export function chooseRoadTarget(state: GameState, playerId: PlayerId): RoadTarget | null {
  const start = networkVertices(state, playerId);
  if (start.size === 0) return null;

  type Node = { vid: number; dist: number; firstEdge: number };
  const visited = new Map<number, number>();
  const queue: Node[] = [];

  for (const vid of start) {
    visited.set(vid, 0);
    queue.push({ vid, dist: 0, firstEdge: -1 });
  }

  const targets: RoadTarget[] = [];

  while (queue.length > 0) {
    const { vid, dist, firstEdge } = queue.shift()!;
    if (dist >= 4) continue;

    const v = state.board.vertices[vid];
    if (dist > 0 && occupiedByOpponent(state, vid, playerId)) continue;

    for (const eid of v.edgeIds) {
      if (state.roads.some((r) => r.edgeId === eid)) continue;
      const edge = state.board.edges[eid];
      const next = edge.vertexIds[0] === vid ? edge.vertexIds[1] : edge.vertexIds[0];
      const nextDist = dist + 1;
      const fe = firstEdge === -1 ? eid : firstEdge;

      if (!visited.has(next) || visited.get(next)! > nextDist) {
        visited.set(next, nextDist);
        queue.push({ vid: next, dist: nextDist, firstEdge: fe });

        if (isValidSetupFort(state, next)) {
          targets.push({
            vertexId: next,
            firstEdge: fe,
            dist: nextDist,
            value: evalTargetVertex(state, playerId, next) - nextDist * DISTANCE_PENALTY,
          });
        }
      }
    }
  }

  if (targets.length === 0) return null;
  targets.sort((a, b) => b.value - a.value);
  return targets[0];
}

// vid に自分の拠点を1つ足すと仮定したときの、街道網の敷居への前進に対する加点。
// 既に成立済み／vid が網に寄与しない場合は 0。敷居は player 別（徳川2/他3）。
export function networkGainBonus(state: GameState, playerId: PlayerId, vid: number): number {
  const player = state.players.find((p) => p.id === playerId)!;
  const threshold = networkMinFor(player);
  const cur = networkStrongholdCount(state, playerId);
  if (cur >= threshold) return 0;                       // 既に成立
  const after = networkStrongholdCount(state, playerId, vid);
  if (after <= cur) return 0;                           // この砦は網に寄与しない
  return after >= threshold ? NETWORK_COMPLETE_BONUS : NETWORK_STEP_BONUS;
}

export function deficitFor(
  state: GameState,
  playerId: PlayerId,
  cost: Partial<Record<ResourceType, number>>
): Partial<Record<ResourceType, number>> {
  const player = state.players.find((p) => p.id === playerId)!;
  const deficit: Partial<Record<ResourceType, number>> = {};
  for (const r of ALL_RESOURCES) {
    const need = (cost[r] ?? 0) - player.resources[r];
    if (need > 0) deficit[r] = need;
  }
  return deficit;
}
