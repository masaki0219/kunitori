import { COSTS } from '../config/rules';
import { ownRoadsAtVertex } from './board';
import { canAfford, payCost } from './resources';
import { recomputeAfterBuild } from './scoring';
import { isValidSetupFort } from './setup';
import { GameState, PlayerId } from './types';

function getPlayer(state: GameState, playerId: PlayerId) {
  return state.players.find((p) => p.id === playerId)!;
}

export function isValidRoad(state: GameState, edgeId: number, playerId: PlayerId): boolean {
  const edge = state.board.edges[edgeId];
  if (!edge) return false;
  if (state.roads.some((r) => r.edgeId === edgeId)) return false;

  return edge.vertexIds.some((vid) => {
    const building = state.buildings.find((b) => b.vertexId === vid);
    if (building) return building.owner === playerId;
    return ownRoadsAtVertex(state, vid, playerId).length > 0;
  });
}

export function isValidFort(state: GameState, vertexId: number, playerId: PlayerId): boolean {
  if (!isValidSetupFort(state, vertexId)) return false;
  const vertex = state.board.vertices[vertexId];
  return vertex.edgeIds.some((eid) =>
    state.roads.some((r) => r.edgeId === eid && r.owner === playerId)
  );
}

export function getBuildableEdges(state: GameState, playerId: PlayerId): number[] {
  return state.board.edges
    .filter((e) => isValidRoad(state, e.id, playerId))
    .map((e) => e.id);
}

export function getBuildableVertices(state: GameState, playerId: PlayerId): number[] {
  return state.board.vertices
    .filter((v) => isValidFort(state, v.id, playerId))
    .map((v) => v.id);
}

export function getUpgradableForts(state: GameState, playerId: PlayerId): number[] {
  return state.buildings
    .filter((b) => b.owner === playerId && b.type === 'fort')
    .map((b) => b.vertexId);
}

export function buildRoad(state: GameState, edgeId: number): GameState {
  if (state.phase !== 'main') return state;
  const playerId = state.currentPlayer;
  const player = getPlayer(state, playerId);
  const free = state.freeRoadsLeft > 0;

  if (player.piecesLeft.road <= 0) return state;
  if (!free && !canAfford(player.resources, COSTS.road)) return state;
  if (!isValidRoad(state, edgeId, playerId)) return state;

  const players = state.players.map((p) => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      resources: free ? p.resources : payCost(p.resources, COSTS.road),
      piecesLeft: { ...p.piecesLeft, road: p.piecesLeft.road - 1 },
    };
  });

  const next: GameState = {
    ...state,
    players,
    roads: [...state.roads, { edgeId, owner: playerId }],
    freeRoadsLeft: free ? state.freeRoadsLeft - 1 : state.freeRoadsLeft,
  };

  return recomputeAfterBuild(next);
}

export function buildFort(state: GameState, vertexId: number): GameState {
  if (state.phase !== 'main') return state;
  const playerId = state.currentPlayer;
  const player = getPlayer(state, playerId);

  if (player.piecesLeft.fort <= 0) return state;
  if (!canAfford(player.resources, COSTS.fort)) return state;
  if (!isValidFort(state, vertexId, playerId)) return state;

  const players = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          resources: payCost(p.resources, COSTS.fort),
          piecesLeft: { ...p.piecesLeft, fort: p.piecesLeft.fort - 1 },
        }
      : p
  );

  const next: GameState = {
    ...state,
    players,
    buildings: [...state.buildings, { vertexId, owner: playerId, type: 'fort' }],
  };

  return recomputeAfterBuild(next);
}

export function buildCastle(state: GameState, vertexId: number): GameState {
  if (state.phase !== 'main') return state;
  const playerId = state.currentPlayer;
  const player = getPlayer(state, playerId);
  const existing = state.buildings.find((b) => b.vertexId === vertexId);

  if (!existing || existing.owner !== playerId || existing.type !== 'fort') return state;
  if (player.piecesLeft.castle <= 0) return state;
  if (!canAfford(player.resources, COSTS.castle)) return state;

  const players = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          resources: payCost(p.resources, COSTS.castle),
          piecesLeft: {
            ...p.piecesLeft,
            castle: p.piecesLeft.castle - 1,
            fort: p.piecesLeft.fort + 1,
          },
        }
      : p
  );

  const buildings = state.buildings.map((b) =>
    b.vertexId === vertexId ? { ...b, type: 'castle' as const } : b
  );

  const next: GameState = { ...state, players, buildings };
  return recomputeAfterBuild(next);
}

export function buyCard(state: GameState): GameState {
  if (state.phase !== 'main') return state;
  if (state.deck.length === 0) return state;
  const playerId = state.currentPlayer;
  const player = getPlayer(state, playerId);
  if (!canAfford(player.resources, COSTS.card)) return state;

  const [drawn, ...restDeck] = state.deck;

  const players = state.players.map((p) =>
    p.id === playerId
      ? {
          ...p,
          resources: payCost(p.resources, COSTS.card),
          cards: [...p.cards, drawn],
          cardsBoughtThisTurn: [...p.cardsBoughtThisTurn, drawn],
        }
      : p
  );

  return recomputeAfterBuild({ ...state, players, deck: restDeck });
}
