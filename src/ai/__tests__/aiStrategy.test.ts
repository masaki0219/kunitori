import { buildBoardGeometry } from '../../game/board';
import { getBuildableEdges } from '../../game/build';
import { emptyResources } from '../../game/resources';
import { networkStrongholdCount } from '../../game/scoring';
import { GameState, Player, PlayerId } from '../../game/types';
import {
  networkVertices,
  networkGainBonus,
  chooseRoadTarget,
  evalTargetVertex,
  scoreVertex,
  deficitFor,
} from '../aiStrategy';

function makePlayer(id: number): Player {
  return {
    id,
    name: `P${id}`,
    isAI: false,
    color: '#000',
    daimyo: 'toyotomi',
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

describe('networkVertices', () => {
  it('includes building vertex', () => {
    const state = makeState();
    state.buildings = [{ vertexId: 0, owner: 0, type: 'fort' }];
    const nv = networkVertices(state, 0);
    expect(nv.has(0)).toBe(true);
  });

  it('includes both endpoints of an owned road', () => {
    const state = makeState();
    const v0 = state.board.vertices[0];
    const neighborId = v0.neighborVertexIds[0];
    const edge = state.board.edges.find((e) =>
      (e.vertexIds[0] === v0.id && e.vertexIds[1] === neighborId) ||
      (e.vertexIds[1] === v0.id && e.vertexIds[0] === neighborId)
    )!;
    state.buildings = [{ vertexId: v0.id, owner: 0, type: 'fort' }];
    state.roads = [{ edgeId: edge.id, owner: 0 }];

    const nv = networkVertices(state, 0);
    expect(nv.has(v0.id)).toBe(true);
    expect(nv.has(neighborId)).toBe(true);
  });

  it('does not include vertices belonging to another player', () => {
    const state = makeState();
    state.buildings = [
      { vertexId: 0, owner: 0, type: 'fort' },
      { vertexId: 5, owner: 1, type: 'fort' },
    ];
    const nv = networkVertices(state, 0);
    expect(nv.has(5)).toBe(false);
  });
});

describe('chooseRoadTarget', () => {
  it('returns firstEdge included in getBuildableEdges', () => {
    const state = makeState();
    const v0 = state.board.vertices[0];
    const edgeId = v0.edgeIds[0];
    state.buildings = [{ vertexId: v0.id, owner: 0, type: 'fort' }];
    state.roads = [{ edgeId, owner: 0 }];

    const result = chooseRoadTarget(state, 0);
    expect(result).not.toBeNull();
    if (result !== null) {
      const buildable = getBuildableEdges(state, 0);
      expect(buildable.includes(result.firstEdge)).toBe(true);
    }
  });

  it('returns null when all paths are blocked by opponent buildings', () => {
    const state = makeState();
    const v0 = state.board.vertices[0];
    const blockBuildings = v0.neighborVertexIds.map((nid) => ({
      vertexId: nid,
      owner: 1 as PlayerId,
      type: 'fort' as const,
    }));
    state.buildings = [
      { vertexId: v0.id, owner: 0, type: 'fort' },
      ...blockBuildings,
    ];

    const result = chooseRoadTarget(state, 0);
    expect(result).toBeNull();
  });

  it('returns null when network is empty', () => {
    const state = makeState();
    const result = chooseRoadTarget(state, 0);
    expect(result).toBeNull();
  });
});

describe('evalTargetVertex', () => {
  it('scores higher when vertex provides uncovered resource', () => {
    const state = makeState(); // all forest/token 6, no buildings

    // Without any buildings, timber is uncovered → new resource bonus applied
    const scoreWithBonus = evalTargetVertex(state, 0, 0);

    // After player 0 places fort at vertex 0, timber becomes covered
    state.buildings = [{ vertexId: 0, owner: 0, type: 'fort' }];
    const scoreNoCoverage = evalTargetVertex(state, 0, 0);

    expect(scoreWithBonus).toBeGreaterThan(scoreNoCoverage);
  });

  it('is consistent with scoreVertex base when all resources are covered', () => {
    const state = makeState(); // all forest
    // Cover all of vertex 0's resources (timber) by placing fort there
    state.buildings = [{ vertexId: 0, owner: 0, type: 'fort' }];

    const eval0 = evalTargetVertex(state, 0, 0);
    const base0 = scoreVertex(state, 0);
    // All resources at vertex 0 are timber (covered) → no new resource bonus, no port
    expect(eval0).toBe(base0);
  });

  it('gives quarry vertex higher score than same-token forest vertex when timber covered', () => {
    const state = makeState(); // all forest/token 6
    // Change one hex to quarry (stone) — a new resource
    state.board.hexes[5].terrain = 'quarry';

    // Player 0 covers timber via a fort at a forest-only vertex
    const fortVertexId = state.board.hexes[1].vertexIds.find((vid) =>
      !state.board.vertices[vid].hexIds.includes(5)
    )!;
    state.buildings = [{ vertexId: fortVertexId, owner: 0, type: 'fort' }];

    const quarryVertexId = state.board.hexes[5].vertexIds[0];
    const forestOnlyVertexId = state.board.vertices.find(
      (v) =>
        v.id !== quarryVertexId &&
        v.hexIds.every(
          (hid) => state.board.hexes.find((h) => h.id === hid)!.terrain === 'forest'
        )
    )!.id;

    // quarry vertex introduces stone (new resource) → bonus applied
    expect(evalTargetVertex(state, 0, quarryVertexId)).toBeGreaterThan(
      evalTargetVertex(state, 0, forestOnlyVertexId)
    );
  });
});

describe('networkStrongholdCount', () => {
  it('街道が無ければ0', () => {
    expect(networkStrongholdCount(makeState(), 0)).toBe(0);
  });

  it('1本の街道で繋いだ2拠点は2と数える', () => {
    const state = makeState();
    const v0 = state.board.vertices[0];
    const nid = v0.neighborVertexIds[0];
    const edge = state.board.edges.find((e) =>
      (e.vertexIds[0] === v0.id && e.vertexIds[1] === nid) ||
      (e.vertexIds[1] === v0.id && e.vertexIds[0] === nid))!;
    state.buildings = [
      { vertexId: v0.id, owner: 0, type: 'fort' },
      { vertexId: nid,   owner: 0, type: 'fort' },
    ];
    state.roads = [{ edgeId: edge.id, owner: 0 }];
    expect(networkStrongholdCount(state, 0)).toBe(2);
  });

  it('extraVid で先読みの+1が数えられる', () => {
    const state = makeState();
    const v0 = state.board.vertices[0];
    const nid = v0.neighborVertexIds[0];
    const edge = state.board.edges.find((e) =>
      (e.vertexIds[0] === v0.id && e.vertexIds[1] === nid) ||
      (e.vertexIds[1] === v0.id && e.vertexIds[0] === nid))!;
    state.buildings = [{ vertexId: v0.id, owner: 0, type: 'fort' }];
    state.roads = [{ edgeId: edge.id, owner: 0 }];
    expect(networkStrongholdCount(state, 0)).toBe(1);
    expect(networkStrongholdCount(state, 0, nid)).toBe(2);
  });
});

describe('networkGainBonus', () => {
  it('街道網が成立済みなら0を返す', () => {
    const state = makeState();
    // toyotomi: 敷居3。3拠点を街道で繋ぐ。
    const v0 = state.board.vertices[0];
    const n1 = v0.neighborVertexIds[0];
    const v1 = state.board.vertices[n1];
    const n2 = v1.neighborVertexIds.find((id) => id !== v0.id)!;
    const e01 = state.board.edges.find((e) =>
      (e.vertexIds[0] === v0.id && e.vertexIds[1] === n1) ||
      (e.vertexIds[1] === v0.id && e.vertexIds[0] === n1))!;
    const e12 = state.board.edges.find((e) =>
      (e.vertexIds[0] === n1 && e.vertexIds[1] === n2) ||
      (e.vertexIds[1] === n1 && e.vertexIds[0] === n2))!;
    state.buildings = [
      { vertexId: v0.id, owner: 0, type: 'fort' },
      { vertexId: n1,    owner: 0, type: 'fort' },
      { vertexId: n2,    owner: 0, type: 'fort' },
    ];
    state.roads = [
      { edgeId: e01.id, owner: 0 },
      { edgeId: e12.id, owner: 0 },
    ];
    // 既に成立（3拠点）→ 0
    expect(networkGainBonus(state, 0, n2)).toBe(0);
  });

  it('徳川(敷居2)で2拠点目を繋ぐとCOMPLETEボーナスを返す', () => {
    const state = makeState();
    state.players[0].daimyo = 'tokugawa';
    const v0 = state.board.vertices[0];
    const nid = v0.neighborVertexIds[0];
    const edge = state.board.edges.find((e) =>
      (e.vertexIds[0] === v0.id && e.vertexIds[1] === nid) ||
      (e.vertexIds[1] === v0.id && e.vertexIds[0] === nid))!;
    state.buildings = [{ vertexId: v0.id, owner: 0, type: 'fort' }];
    state.roads = [{ edgeId: edge.id, owner: 0 }];
    // cur=1, after=2 >= threshold(2) → COMPLETE
    const bonus = networkGainBonus(state, 0, nid);
    expect(bonus).toBeGreaterThan(0);
  });
});

describe('deficitFor', () => {
  it('returns only resources needed beyond current holdings', () => {
    const state = makeState();
    state.players[0].resources = { timber: 1, stone: 0, rice: 2, horse: 0, iron: 0 };

    const cost = { timber: 1, stone: 1, rice: 1, horse: 1 };
    const deficit = deficitFor(state, 0, cost);

    expect(deficit.timber).toBeUndefined(); // has 1, needs 1 → no deficit
    expect(deficit.stone).toBe(1);
    expect(deficit.rice).toBeUndefined();   // has 2, needs 1 → no deficit
    expect(deficit.horse).toBe(1);
    expect(deficit.iron).toBeUndefined();   // not in cost
  });

  it('returns empty object when all costs are covered', () => {
    const state = makeState();
    state.players[0].resources = { timber: 2, stone: 2, rice: 2, horse: 2, iron: 2 };
    const deficit = deficitFor(state, 0, { timber: 1, stone: 1 });
    expect(Object.keys(deficit).length).toBe(0);
  });

  it('returns full cost when player has nothing', () => {
    const state = makeState();
    // resources is already emptyResources (all 0)
    const deficit = deficitFor(state, 0, { rice: 2, iron: 3 });
    expect(deficit.rice).toBe(2);
    expect(deficit.iron).toBe(3);
  });
});
