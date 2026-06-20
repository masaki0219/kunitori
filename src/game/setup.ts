import { PIECE_LIMITS, PLAYER_COLORS } from '../config/rules';
import { assignPorts, assignTerrainAndTokens, buildBoardGeometry } from './board';
import { emptyResources, addResources } from './resources';
import { buildVassalDeck } from './vassals';
import { GameState, Player, PlayerId, ResourceType, TerrainType } from './types';

export function terrainResource(t: TerrainType): ResourceType | null {
  switch (t) {
    case 'forest': return 'timber';
    case 'quarry': return 'stone';
    case 'paddy': return 'rice';
    case 'pasture': return 'horse';
    case 'mine': return 'iron';
    case 'wasteland': return null;
  }
}

export interface CreateGameConfig {
  players: { name: string; isAI: boolean }[];
}

export function createInitialGame(config: CreateGameConfig): GameState {
  const board = assignPorts(assignTerrainAndTokens(buildBoardGeometry()));
  const banditHex = board.hexes.find((h) => h.terrain === 'wasteland')!;

  const players: Player[] = config.players.map((p, i) => ({
    id: i,
    name: p.name,
    isAI: p.isAI,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    resources: emptyResources(),
    vassals: [],
    playedWarlords: 0,
    piecesLeft: { road: PIECE_LIMITS.road, fort: PIECE_LIMITS.fort, castle: PIECE_LIMITS.castle },
  }));

  const playerOrder: PlayerId[] = players.map((p) => p.id);
  const snakeOrder: PlayerId[] = [...playerOrder, ...[...playerOrder].reverse()];

  return {
    screen: 'game',
    phase: 'setupPlacement',
    board,
    terrainSeed: Date.now(),
    buildings: [],
    roads: [],
    banditHexId: banditHex.id,
    players,
    currentPlayer: snakeOrder[0],
    vassalDeck: buildVassalDeck(),
    dice: null,
    largestArmyHolder: null,
    pendingTrade: null,
    discardQueue: [],
    setup: {
      order: snakeOrder,
      index: 0,
      pendingRoadFromVertex: null,
    },
    winner: null,
    log: [],
  };
}

// ===== 初期配置 =====

export function isValidSetupFort(state: GameState, vertexId: number): boolean {
  const vertex = state.board.vertices[vertexId];
  if (!vertex) return false;
  const hasBuilding = state.buildings.some((b) => b.vertexId === vertexId);
  if (hasBuilding) return false;
  const neighborHasBuilding = vertex.neighborVertexIds.some((nid) =>
    state.buildings.some((b) => b.vertexId === nid)
  );
  return !neighborHasBuilding;
}

function currentSetupPlayer(state: GameState): PlayerId {
  return state.setup.order[state.setup.index];
}

export function grantInitialResources(state: GameState, vertexId: number): GameState {
  const vertex = state.board.vertices[vertexId];
  const playerId = currentSetupPlayer(state);
  const players = state.players.map((p) => {
    if (p.id !== playerId) return p;
    let resources = p.resources;
    for (const hexId of vertex.hexIds) {
      const hex = state.board.hexes.find((h) => h.id === hexId)!;
      const resource = terrainResource(hex.terrain);
      if (resource) resources = addResources(resources, { [resource]: 1 } as Partial<Record<ResourceType, number>>);
    }
    return { ...p, resources };
  });
  return { ...state, players };
}

export function placeSetupFort(state: GameState, vertexId: number): GameState {
  if (state.phase !== 'setupPlacement') return state;
  if (!isValidSetupFort(state, vertexId)) return state;

  const playerId = currentSetupPlayer(state);
  const players = state.players.map((p) =>
    p.id === playerId
      ? { ...p, piecesLeft: { ...p.piecesLeft, fort: p.piecesLeft.fort - 1 } }
      : p
  );

  let next: GameState = {
    ...state,
    players,
    buildings: [...state.buildings, { vertexId, owner: playerId, type: 'fort' }],
    setup: { ...state.setup, pendingRoadFromVertex: vertexId },
  };

  const isSecondRound = state.setup.index >= state.players.length;
  if (isSecondRound) {
    next = grantInitialResources(next, vertexId);
  }

  return next;
}

export function placeSetupRoad(state: GameState, edgeId: number): GameState {
  if (state.phase !== 'setupPlacement') return state;
  const fromVertex = state.setup.pendingRoadFromVertex;
  if (fromVertex === null) return state;
  const edge = state.board.edges[edgeId];
  if (!edge) return state;
  if (!edge.vertexIds.includes(fromVertex)) return state;
  if (state.roads.some((r) => r.edgeId === edgeId)) return state;

  const playerId = currentSetupPlayer(state);
  const players = state.players.map((p) =>
    p.id === playerId
      ? { ...p, piecesLeft: { ...p.piecesLeft, road: p.piecesLeft.road - 1 } }
      : p
  );

  const nextIndex = state.setup.index + 1;
  const done = nextIndex >= state.setup.order.length;

  return {
    ...state,
    players,
    roads: [...state.roads, { edgeId, owner: playerId }],
    setup: { ...state.setup, index: nextIndex, pendingRoadFromVertex: null },
    phase: done ? 'roll' : 'setupPlacement',
    currentPlayer: done ? state.setup.order[0] : state.setup.order[nextIndex],
  };
}
