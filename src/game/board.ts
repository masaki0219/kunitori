import { GENERIC_PORT_COUNT, NUMBER_TOKENS, PORT_RATES, SPECIFIC_PORT_RESOURCES, TERRAIN_COUNTS } from '../config/rules';
import { shuffle } from '../utils/random';
import {
  AxialCoord,
  BoardGeometry,
  Edge,
  GameState,
  Hex,
  PlayerId,
  Port,
  ResourceType,
  TerrainType,
  Vertex,
} from './types';

export const HEX_SIZE = 36; // 六角形の中心から角までの距離(px)

// 半径2の六角形 = 19ヘクス
export function hexCoords(): AxialCoord[] {
  const N = 2;
  const coords: AxialCoord[] = [];
  for (let q = -N; q <= N; q++) {
    const r1 = Math.max(-N, -q - N);
    const r2 = Math.min(N, -q + N);
    for (let r = r1; r <= r2; r++) coords.push({ q, r });
  }
  return coords; // 長さ19
}

// axial → ピクセル中心（pointy-top）
export function hexToPixel(coord: AxialCoord, size: number = HEX_SIZE) {
  const x = size * Math.sqrt(3) * (coord.q + coord.r / 2);
  const y = size * (3 / 2) * coord.r;
  return { x, y };
}

// 六角形の6角（pointy-top）
export function hexCorners(center: { x: number; y: number }, size: number = HEX_SIZE) {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push({ x: center.x + size * Math.cos(angle), y: center.y + size * Math.sin(angle) });
  }
  return pts; // 時計回り（画面座標はy下向きなので見た目は時計回り）
}

function keyOf(p: { x: number; y: number }) {
  // 四捨五入してキー化（浮動小数の誤差対策）。小数1桁で十分まとまる
  return `${Math.round(p.x * 10) / 10}_${Math.round(p.y * 10) / 10}`;
}

export function buildBoardGeometry(size: number = HEX_SIZE): BoardGeometry {
  const coords = hexCoords();

  // --- まず中心と角を計算 ---
  const rawHexes = coords.map((coord, id) => {
    const center = hexToPixel(coord, size);
    const corners = hexCorners(center, size);
    return { id, coord, center, corners };
  });

  // --- 頂点の重複排除 ---
  const vertexMap = new Map<string, Vertex>();
  const getVertexId = (p: { x: number; y: number }): number => {
    const k = keyOf(p);
    let v = vertexMap.get(k);
    if (!v) {
      v = { id: vertexMap.size, pos: { x: p.x, y: p.y }, hexIds: [], neighborVertexIds: [], edgeIds: [] };
      vertexMap.set(k, v);
    }
    return v.id;
  };

  // --- 辺の重複排除 ---
  const edgeMap = new Map<string, Edge>();
  const getEdgeId = (a: number, b: number, pa: { x: number; y: number }, pb: { x: number; y: number }): number => {
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    let e = edgeMap.get(k);
    if (!e) {
      e = { id: edgeMap.size, vertexIds: [a, b], pos: { x1: pa.x, y1: pa.y, x2: pb.x, y2: pb.y } };
      edgeMap.set(k, e);
    }
    return e.id;
  };

  // --- ヘクスごとに頂点・辺を割り当て ---
  const hexes: Hex[] = rawHexes.map((h) => {
    const vIds = h.corners.map(getVertexId);
    const eIds: number[] = [];
    for (let i = 0; i < 6; i++) {
      const a = vIds[i];
      const b = vIds[(i + 1) % 6];
      eIds.push(getEdgeId(a, b, h.corners[i], h.corners[(i + 1) % 6]));
    }
    return {
      id: h.id, coord: h.coord, center: h.center,
      terrain: 'wasteland' as TerrainType, token: null, // 後で配置
      vertexIds: vIds, edgeIds: eIds,
    };
  });

  // 頂点 → ヘクス の逆参照（hexes 確定後にまとめて行う）
  const vertexById = new Map<number, Vertex>();
  for (const v of vertexMap.values()) vertexById.set(v.id, v);
  for (const h of hexes) {
    for (const vid of h.vertexIds) {
      const v = vertexById.get(vid)!;
      if (!v.hexIds.includes(h.id)) v.hexIds.push(h.id);
    }
  }

  const vertices = [...vertexMap.values()].sort((a, b) => a.id - b.id);
  const edges = [...edgeMap.values()].sort((a, b) => a.id - b.id);

  // --- 頂点の隣接（辺で直結する頂点・接する辺）を埋める ---
  for (const e of edges) {
    const [a, b] = e.vertexIds;
    const va = vertices[a];
    const vb = vertices[b];
    if (!va.neighborVertexIds.includes(b)) va.neighborVertexIds.push(b);
    if (!vb.neighborVertexIds.includes(a)) vb.neighborVertexIds.push(a);
    if (!va.edgeIds.includes(e.id)) va.edgeIds.push(e.id);
    if (!vb.edgeIds.includes(e.id)) vb.edgeIds.push(e.id);
  }

  return { hexes, vertices, edges, ports: [] };
}

export function assignTerrainAndTokens(geo: BoardGeometry): BoardGeometry {
  // 地形プールを作ってシャッフル
  const pool: TerrainType[] = [];
  (Object.keys(TERRAIN_COUNTS) as TerrainType[]).forEach((t) => {
    for (let i = 0; i < TERRAIN_COUNTS[t]; i++) pool.push(t);
  });
  const terrains = shuffle(pool); // length 19

  geo.hexes.forEach((h, i) => { h.terrain = terrains[i]; });

  // 荒地以外に数字チップを配る
  const tokens = shuffle([...NUMBER_TOKENS]); // length 18
  let ti = 0;
  geo.hexes.forEach((h) => {
    if (h.terrain === 'wasteland') { h.token = null; } else { h.token = tokens[ti++]; }
  });

  return geo;
}

// 1つのヘクスにしか属さない辺 = 海岸辺
function coastalEdgeIds(geo: BoardGeometry): number[] {
  const count = new Map<number, number>();
  for (const h of geo.hexes) for (const eid of h.edgeIds) {
    count.set(eid, (count.get(eid) ?? 0) + 1);
  }
  return geo.edges.filter((e) => (count.get(e.id) ?? 0) === 1).map((e) => e.id);
}

export function assignPorts(geo: BoardGeometry): BoardGeometry {
  const xs = geo.vertices.map((v) => v.pos.x);
  const ys = geo.vertices.map((v) => v.pos.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

  const coastal = coastalEdgeIds(geo);
  // 角度順ソート（辺の中点で）
  const withAngle = coastal.map((eid) => {
    const e = geo.edges[eid];
    const mx = (e.pos.x1 + e.pos.x2) / 2, my = (e.pos.y1 + e.pos.y2) / 2;
    return { eid, angle: Math.atan2(my - cy, mx - cx) };
  }).sort((a, b) => a.angle - b.angle);

  const total = SPECIFIC_PORT_RESOURCES.length + GENERIC_PORT_COUNT; // 9
  // 等間隔に間引いて total 個選ぶ（隣接回避のため step は2以上を目安に）
  const step = Math.max(2, Math.floor(withAngle.length / total));
  const chosen: number[] = [];
  for (let i = 0; chosen.length < total && i < withAngle.length; i += step) {
    chosen.push(withAngle[i].eid);
  }

  // レート/資源の割り当て（資源2:1 → 汎用3:1）
  const specs = shuffle([...SPECIFIC_PORT_RESOURCES]);
  const slots: { rate: number; resource: ResourceType | null }[] = [
    ...specs.map((r) => ({ rate: PORT_RATES.specific as number, resource: r })),
    ...Array.from({ length: GENERIC_PORT_COUNT }, () => ({ rate: PORT_RATES.generic as number, resource: null })),
  ];

  const ports: Port[] = chosen.map((eid, i) => {
    const e = geo.edges[eid];
    const mx = (e.pos.x1 + e.pos.x2) / 2, my = (e.pos.y1 + e.pos.y2) / 2;
    const len = Math.hypot(mx - cx, my - cy) || 1;
    const off = 0.8 * HEX_SIZE;
    return {
      id: i,
      edgeId: eid,
      vertexIds: [e.vertexIds[0], e.vertexIds[1]] as [number, number],
      rate: slots[i].rate,
      resource: slots[i].resource,
      markerPos: { x: mx + (mx - cx) / len * off, y: my + (my - cy) / len * off },
    };
  });

  return { ...geo, ports };
}

export function boardViewBox(geo: BoardGeometry, pad: number = 24): string {
  const xs = geo.vertices.map((v) => v.pos.x);
  const ys = geo.vertices.map((v) => v.pos.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = (Math.max(...xs) - minX) + pad;
  const h = (Math.max(...ys) - minY) + pad;
  return `${minX} ${minY} ${w} ${h}`;
}

// ===== 隣接ヘルパー =====

// あるヘクスに隣接する頂点に建物があるプレイヤーの一覧（重複なし）
export function playersAdjacentToHex(state: GameState, hexId: number): PlayerId[] {
  const hex = state.board.hexes.find((h) => h.id === hexId);
  if (!hex) return [];
  const owners = new Set<PlayerId>();
  for (const vid of hex.vertexIds) {
    const b = state.buildings.find((bb) => bb.vertexId === vid);
    if (b) owners.add(b.owner);
  }
  return [...owners];
}

// 2頂点が辺で直結しているか
export function areVerticesAdjacent(geo: BoardGeometry, a: number, b: number): boolean {
  const va = geo.vertices[a];
  return !!va && va.neighborVertexIds.includes(b);
}

// ある頂点に接する辺のうち、指定プレイヤーの街道がある辺
export function ownRoadsAtVertex(state: GameState, vertexId: number, playerId: PlayerId): number[] {
  const v = state.board.vertices[vertexId];
  if (!v) return [];
  return v.edgeIds.filter((eid) => state.roads.some((r) => r.edgeId === eid && r.owner === playerId));
}

// 2ヘクスが隣接（共有頂点を持つ）か
export function areHexesAdjacent(geo: BoardGeometry, hexA: number, hexB: number): boolean {
  if (hexA === hexB) return false;
  const a = geo.hexes.find((h) => h.id === hexA);
  const b = geo.hexes.find((h) => h.id === hexB);
  if (!a || !b) return false;
  return a.vertexIds.some((v) => b.vertexIds.includes(v));
}
