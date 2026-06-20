import { buildBoardGeometry } from '../board';
import { buildFort, buildRoad, getBuildableEdges, getBuildableVertices, isValidRoad } from '../build';
import { produceResources } from '../production';
import { computePrestige, hasStrongholdNetwork } from '../scoring';
import { emptyResources } from '../resources';
import { bankTrade, effectiveTradeRate } from '../trade';
import { GameState, Player } from '../types';

function makePlayer(id: number): Player {
  return {
    id,
    name: `P${id}`,
    isAI: false,
    color: '#000',
    resources: emptyResources(),
    vassals: [],
    raids: 0,
    piecesLeft: { road: 15, fort: 5, castle: 4 },
  };
}

function makeState(): GameState {
  const board = buildBoardGeometry();
  board.hexes.forEach((h) => { h.terrain = 'forest'; h.token = 6; });
  return {
    screen: 'game',
    phase: 'main',
    board,
    terrainSeed: 0,
    buildings: [],
    roads: [],
    banditHexId: -1,
    players: [makePlayer(0), makePlayer(1)],
    currentPlayer: 0,
    vassalDeck: [],
    dice: null,
    pendingTrade: null,
    discardQueue: [],
    setup: { order: [0, 1, 1, 0], index: 4, pendingRoadFromVertex: null },
    winner: null,
    log: [],
  };
}

describe('build validations', () => {
  it('forbids building a road with no connection', () => {
    const state = makeState();
    expect(isValidRoad(state, 0, 0)).toBe(false);
    expect(getBuildableEdges(state, 0).length).toBe(0);
  });

  it('allows building a road from an existing fort', () => {
    let state = makeState();
    const vertex = state.board.vertices[0];
    state = {
      ...state,
      buildings: [{ vertexId: vertex.id, owner: 0, type: 'fort' }],
    };
    const edgeId = vertex.edgeIds[0];
    expect(isValidRoad(state, edgeId, 0)).toBe(true);
  });

  it('buildRoad pays cost and decrements pieces', () => {
    let state = makeState();
    const vertex = state.board.vertices[0];
    state = { ...state, buildings: [{ vertexId: vertex.id, owner: 0, type: 'fort' }] };
    state.players[0].resources = { timber: 1, stone: 1, rice: 0, horse: 0, iron: 0 };
    const edgeId = vertex.edgeIds[0];
    const next = buildRoad(state, edgeId);
    expect(next.roads.length).toBe(1);
    expect(next.players[0].resources.timber).toBe(0);
    expect(next.players[0].piecesLeft.road).toBe(14);
  });
});

describe('production', () => {
  it('grants resources to forts and castles, skips bandit hex', () => {
    let state = makeState();
    state.board.hexes.forEach((h) => { h.token = 8; }); // avoid neighbors sharing token 6
    const hex = state.board.hexes[0];
    hex.token = 6;
    const vertex = hex.vertexIds[0];
    state = {
      ...state,
      buildings: [{ vertexId: vertex, owner: 0, type: 'fort' }],
      banditHexId: hex.id,
    };
    const next = produceResources(state, 6);
    expect(next.players[0].resources.timber).toBe(0); // bandit blocks
  });

  it('produces when bandit elsewhere', () => {
    let state = makeState();
    const hex = state.board.hexes[0];
    const vertex = hex.vertexIds[0];
    state = {
      ...state,
      buildings: [{ vertexId: vertex, owner: 0, type: 'castle' }],
      banditHexId: -1,
    };
    const next = produceResources(state, 6);
    expect(next.players[0].resources.timber).toBeGreaterThanOrEqual(2);
  });
});

describe('stronghold network', () => {
  function buildChain(state: GameState, length: number): { path: number[]; roads: { edgeId: number; owner: number }[] } {
    const start = state.board.vertices[0];
    let path: number[] = [start.id];
    let current = start;
    for (let i = 0; i < length; i++) {
      const next = current.neighborVertexIds.find((nid) => !path.includes(nid));
      if (next === undefined) break;
      path.push(next);
      current = state.board.vertices[next];
    }
    const roads = [];
    for (let i = 0; i < path.length - 1; i++) {
      const edge = state.board.edges.find(
        (e) => e.vertexIds.includes(path[i]) && e.vertexIds.includes(path[i + 1])
      )!;
      roads.push({ edgeId: edge.id, owner: 0 });
    }
    return { path, roads };
  }

  it('is true when 3 of own strongholds are connected by own roads', () => {
    let state = makeState();
    const { path, roads } = buildChain(state, 5);
    const buildings = [path[0], path[1], path[2]].map((vertexId) => ({ vertexId, owner: 0, type: 'fort' as const }));
    state = { ...state, roads, buildings };
    expect(hasStrongholdNetwork(state, 0)).toBe(true);
  });

  it('is false when only 2 strongholds are connected', () => {
    let state = makeState();
    const { path, roads } = buildChain(state, 5);
    const buildings = [path[0], path[1]].map((vertexId) => ({ vertexId, owner: 0, type: 'fort' as const }));
    state = { ...state, roads, buildings };
    expect(hasStrongholdNetwork(state, 0)).toBe(false);
  });

  it('is false when there are no roads', () => {
    const state = makeState();
    expect(hasStrongholdNetwork(state, 0)).toBe(false);
  });
});

describe('bank trade', () => {
  it('exchanges 4 of a resource for 1 of another', () => {
    let state = makeState();
    state.players[0].resources = { timber: 4, stone: 0, rice: 0, horse: 0, iron: 0 };
    const next = bankTrade(state, 'timber', 'stone');
    expect(next.players[0].resources.timber).toBe(0);
    expect(next.players[0].resources.stone).toBe(1);
  });
});

describe('vassals', () => {
  it('kaisen (廻船問屋) lowers effectiveTradeRate by 1', () => {
    const state = makeState();
    const base = effectiveTradeRate(state, 0, 'timber');
    state.players[0].vassals = ['kaisen'];
    expect(effectiveTradeRate(state, 0, 'timber')).toBe(base - 1);
  });

  it('fushin (普請奉行) reduces road stone cost by 1', () => {
    let state = makeState();
    const vertex = state.board.vertices[0];
    state = { ...state, buildings: [{ vertexId: vertex.id, owner: 0, type: 'fort' }] };
    state.players[0].vassals = ['fushin'];
    state.players[0].resources = { timber: 1, stone: 0, rice: 0, horse: 0, iron: 0 };
    const edgeId = vertex.edgeIds[0];
    const next = buildRoad(state, edgeId);
    expect(next.roads.length).toBe(1);
  });

  it('hatamoto (旗本) grants +1 prestige', () => {
    const state = makeState();
    const before = computePrestige(state, 0);
    state.players[0].vassals = ['hatamoto'];
    expect(computePrestige(state, 0)).toBe(before + 1);
  });
});
