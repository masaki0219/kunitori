import { HAND_LIMIT_FOR_DISCARD } from '../config/rules';
import { rollTwoDice } from '../utils/random';
import { addResources, countResources } from './resources';
import { terrainResource } from './setup';
import { GameState, PlayerId, ResourceType } from './types';

export function produceResources(state: GameState, sum: number): GameState {
  const hexes = state.board.hexes.filter((h) => h.token === sum && h.id !== state.banditHexId);

  const gains = new Map<PlayerId, Partial<Record<ResourceType, number>>>();
  for (const hex of hexes) {
    const resource = terrainResource(hex.terrain);
    if (!resource) continue;
    for (const vid of hex.vertexIds) {
      const building = state.buildings.find((b) => b.vertexId === vid);
      if (!building) continue;
      const amount = building.type === 'castle' ? 2 : 1;
      const current = gains.get(building.owner) ?? {};
      current[resource] = (current[resource] ?? 0) + amount;
      gains.set(building.owner, current);
    }
  }

  const players = state.players.map((p) => {
    const add = gains.get(p.id);
    if (!add) return p;
    return { ...p, resources: addResources(p.resources, add) };
  });

  return { ...state, players };
}

export function needsDiscard(state: GameState): PlayerId[] {
  return state.players
    .filter((p) => countResources(p.resources) >= HAND_LIMIT_FOR_DISCARD)
    .map((p) => p.id);
}

export function rollAndProduce(state: GameState): GameState {
  const dice = rollTwoDice();
  const sum = dice[0] + dice[1];

  if (sum === 7) {
    const discardQueue = needsDiscard(state);
    return {
      ...state,
      dice,
      discardQueue,
      phase: discardQueue.length > 0 ? 'discard' : 'moveBandit',
    };
  }

  const produced = produceResources(state, sum);
  return { ...produced, dice, phase: 'main' };
}
