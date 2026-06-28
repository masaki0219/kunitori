import { HAND_LIMIT_FOR_DISCARD } from '../config/rules';
import { playersAdjacentToHex } from './board';
import { countResources } from './resources';
import { isDiscardExempt, stealCount } from './vassals';
import { appendLog } from './log';
import { GameState, PlayerId, ResourceType } from './types';

export function needsDiscard(state: GameState): PlayerId[] {
  return state.players
    .filter((p) => !isDiscardExempt(p) && countResources(p.resources) >= HAND_LIMIT_FOR_DISCARD)
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

  return appendLog({ ...state, players, discardQueue, phase }, `${player.name}が年貢を供出しました`);
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
  const me = state.players.find((p) => p.id === state.currentPlayer)!;
  const ALL: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];
  const pool: ResourceType[] = [];
  ALL.forEach((r) => { for (let i = 0; i < target.resources[r]; i++) pool.push(r); });
  if (pool.length === 0) return { ...state, phase: 'main' };

  const n = Math.min(stealCount(me), pool.length);
  const taken: Partial<Record<ResourceType, number>> = {};
  for (let k = 0; k < n; k++) {
    const idx = Math.floor(Math.random() * pool.length);
    const r = pool.splice(idx, 1)[0];
    taken[r] = (taken[r] ?? 0) + 1;
  }
  const players = state.players.map((p) => {
    if (p.id === targetId) {
      const res = { ...p.resources };
      (Object.keys(taken) as ResourceType[]).forEach((r) => { res[r] -= taken[r]!; });
      return { ...p, resources: res };
    }
    if (p.id === state.currentPlayer) {
      const res = { ...p.resources };
      (Object.keys(taken) as ResourceType[]).forEach((r) => { res[r] += taken[r]!; });
      return { ...p, resources: res, raids: p.raids + 1 };
    }
    return p;
  });
  return appendLog({ ...state, players, phase: 'main' }, `${me.name}が${target.name}から略奪しました`);
}
