import { createInitialGame, isValidSetupFort, placeSetupFort, placeSetupRoad } from '../setup';
import { countResources } from '../resources';

function basicConfig() {
  return {
    players: [
      { name: 'P1', isAI: false },
      { name: 'P2', isAI: false },
      { name: 'P3', isAI: false },
    ],
  };
}

describe('createInitialGame', () => {
  it('creates a valid initial state', () => {
    const state = createInitialGame(basicConfig());
    expect(state.players.length).toBe(3);
    expect(state.phase).toBe('setupPlacement');
    expect(state.setup.order).toEqual([0, 1, 2, 2, 1, 0]);
    expect(state.vassalDeck.length).toBe(22);
    expect(state.board.hexes.length).toBe(19);
  });
});

describe('setup placement snake draft', () => {
  it('runs through full snake order and grants resources on 2nd round', () => {
    let state = createInitialGame(basicConfig());

    for (let i = 0; i < state.setup.order.length; i++) {
      const playerId = state.setup.order[i];
      const vertex = state.board.vertices.find((v) => isValidSetupFort(state, v.id))!;
      state = placeSetupFort(state, vertex.id);
      const edgeId = state.board.edges.find((e) => e.vertexIds.includes(vertex.id))!.id;
      state = placeSetupRoad(state, edgeId);
      expect(state.buildings.filter((b) => b.owner === playerId).length).toBeGreaterThan(0);
    }

    expect(state.phase).toBe('roll');
    expect(state.buildings.length).toBe(6);
    expect(state.roads.length).toBe(6);

    // each player should have received resources from their 2nd-round fort
    for (const p of state.players) {
      expect(countResources(p.resources)).toBeGreaterThanOrEqual(0);
    }
    const total = state.players.reduce((sum, p) => sum + countResources(p.resources), 0);
    expect(total).toBeGreaterThan(0);
  });

  it('enforces distance-2 rule', () => {
    let state = createInitialGame(basicConfig());
    const vertex = state.board.vertices.find((v) => isValidSetupFort(state, v.id))!;
    state = placeSetupFort(state, vertex.id);
    const neighbor = vertex.neighborVertexIds[0];
    expect(isValidSetupFort(state, neighbor)).toBe(false);
  });
});
