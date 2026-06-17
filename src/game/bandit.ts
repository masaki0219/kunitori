import { playersAdjacentToHex } from './board';
import { countResources } from './resources';
import { GameState, PlayerId, ResourceType } from './types';

export function needsDiscard(state: GameState): PlayerId[] {
  const HAND_LIMIT = 8;
  return state.players
    .filter((p) => countResources(p.resources) >= HAND_LIMIT)
    .map((p) => p.id);
}

export function discardCards(
  state: GameState,
  playerId: PlayerId,
  give: Partial<Record<ResourceType, number>>
): GameState {
  const player = state.players.find((p) => p.id === playerId)!;
  const total = countResources(player.resources);
  const requiredDiscard = Math.floor(total / 2);
  const giveTotal = Object.values(give).reduce((s, v) => s + (v ?? 0), 0);
  if (giveTotal !== requiredDiscard) return state;

  const players = state.players.map((p) => {
    if (p.id !== playerId) return p;
    const resources = { ...p.resources };
    (Object.keys(give) as ResourceType[]).forEach((k) => {
      resources[k] = resources[k] - (give[k] ?? 0);
    });
    return { ...p, resources };
  });

  const discardQueue = state.discardQueue.filter((id) => id !== playerId);
  const phase = discardQueue.length > 0 ? 'discard' : 'moveBandit';

  return { ...state, players, discardQueue, phase };
}

export function moveBandit(state: GameState, hexId: number): GameState {
  if (hexId === state.banditHexId) return state;
  const hex = state.board.hexes.find((h) => h.id === hexId);
  if (!hex) return state;

  const next: GameState = { ...state, banditHexId: hexId };
  const candidates = playersAdjacentToHex(next, hexId).filter((id) => id !== state.currentPlayer);

  if (candidates.length === 0) {
    return { ...next, phase: 'main' };
  }
  if (candidates.length === 1) {
    return stealFrom(next, candidates[0]);
  }
  return { ...next, phase: 'steal' };
}

export function stealFrom(state: GameState, targetId: PlayerId): GameState {
  const target = state.players.find((p) => p.id === targetId)!;
  const total = countResources(target.resources);

  if (total === 0) {
    return { ...state, phase: 'main' };
  }

  const ALL_RESOURCES: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];
  const pool: ResourceType[] = [];
  ALL_RESOURCES.forEach((r) => {
    for (let i = 0; i < target.resources[r]; i++) pool.push(r);
  });
  const stolen = pool[Math.floor(Math.random() * pool.length)];

  const players = state.players.map((p) => {
    if (p.id === targetId) {
      return { ...p, resources: { ...p.resources, [stolen]: p.resources[stolen] - 1 } };
    }
    if (p.id === state.currentPlayer) {
      return { ...p, resources: { ...p.resources, [stolen]: p.resources[stolen] + 1 } };
    }
    return p;
  });

  return { ...state, players, phase: 'main' };
}
