import { rollTwoDice } from '../utils/random';
import { needsDiscard } from './bandit';
import { addResources } from './resources';
import { terrainResource } from './setup';
import { turnIncome } from './vassals';
import { appendLog } from './log';
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
    const fromVassals = turnIncome(p);
    if (!add && p.id !== state.currentPlayer) return p;
    let resources = add ? addResources(p.resources, add) : p.resources;
    if (p.id === state.currentPlayer) resources = addResources(resources, fromVassals);
    return { ...p, resources };
  });

  return { ...state, players };
}

export function rollAndProduce(state: GameState): GameState {
  const dice = rollTwoDice();
  const sum = dice[0] + dice[1];
  const roller = state.players[state.currentPlayer]?.name ?? '';

  if (sum === 7) {
    const discardQueue = needsDiscard(state);
    return appendLog(
      {
        ...state,
        dice,
        discardQueue,
        phase: discardQueue.length > 0 ? 'discard' : 'moveBandit',
      },
      `${roller}が7を出しました（一揆）`
    );
  }

  const produced = produceResources(state, sum);
  return appendLog({ ...produced, dice, phase: 'main' }, `${roller}が${sum}を出しました`);
}
