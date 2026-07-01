// ===== 基本 =====
export type ResourceType = 'timber' | 'stone' | 'rice' | 'horse' | 'iron';

export type TerrainType =
  | 'forest'    // 木材
  | 'quarry'    // 石
  | 'paddy'     // 米
  | 'pasture'   // 馬
  | 'mine'      // 鉄
  | 'wasteland';// 無産出

export type VassalId = 'fushin' | 'gunshi' | 'kaisen' | 'daikan' | 'kura' | 'hatamoto';

export type DaimyoId = 'oda' | 'toyotomi' | 'tokugawa';

export type BuildingType = 'fort' | 'castle';

export type PlayerId = number; // 0..3

export type Resources = Record<ResourceType, number>; // 各資源の所持数

// ===== 盤面ジオメトリ（05で生成） =====
export interface AxialCoord { q: number; r: number; }

export interface Hex {
  id: number;             // 0..18
  coord: AxialCoord;
  terrain: TerrainType;
  token: number | null;   // 数字チップ(2-12)。荒地は null
  center: { x: number; y: number };  // 描画用ピクセル中心
  vertexIds: number[];    // この六角形の6頂点のID（時計回り）
  edgeIds: number[];      // この六角形の6辺のID
}

export interface Vertex {
  id: number;
  pos: { x: number; y: number };   // 描画用ピクセル座標
  hexIds: number[];                // 接するヘクスID（1〜3個）
  neighborVertexIds: number[];     // 辺で直結する頂点（距離2ルール/街道網に使う）
  edgeIds: number[];               // この頂点に接する辺
}

export interface Edge {
  id: number;
  vertexIds: [number, number];     // 両端の頂点ID
  pos: { x1: number; y1: number; x2: number; y2: number }; // 描画用
}

export interface Port {
  id: number;
  edgeId: number;                 // 接岸する海岸辺（この辺の両端が港の対象頂点）
  vertexIds: [number, number];    // 港の恩恵を得られる2頂点（= 辺の両端）
  rate: number;                   // 湊は 2:1
  resource: ResourceType | null;  // 対象資源
  markerPos: { x: number; y: number }; // 描画用：海側のマーカー位置
}

export interface BoardGeometry {
  hexes: Hex[];
  vertices: Vertex[];
  edges: Edge[];
  ports: Port[];
}

// ===== 盤面上の建物の状態 =====
export interface BuildingState {
  vertexId: number;
  owner: PlayerId;
  type: BuildingType; // fort or castle
}

export interface RoadState {
  edgeId: number;
  owner: PlayerId;
}

// ===== プレイヤー =====
export interface Player {
  id: PlayerId;
  name: string;
  isAI: boolean;
  color: string;                 // 表示色
  daimyo: DaimyoId;              // 開始時に選ぶ大名（固有能力）
  resources: Resources;          // 手札
  vassals: VassalId[];           // 登用済みの家臣（常時公開）
  raids: number;                 // 略奪成功回数（戦功用）
  piecesLeft: { road: number; fort: number; castle: number };
}

// ===== フェーズ / 画面 =====
export type Screen = 'title' | 'home' | 'joinRoom' | 'lobby' | 'setup' | 'game' | 'result';

export type GamePhase =
  | 'setupPlacement'  // 初期配置中
  | 'roll'            // サイコロ前
  | 'discard'         // 7で供出待ち
  | 'moveBandit'      // 一揆移動待ち
  | 'steal'           // 略奪相手選択待ち
  | 'main'            // 交易・建設フェーズ
  | 'gameOver';

export interface PendingTrade {
  from: PlayerId;
  to: PlayerId;
  give: Partial<Record<ResourceType, number>>;
  want: Partial<Record<ResourceType, number>>;
}

// ===== ゲーム全体の状態 =====
export interface GameState {
  screen: Screen;
  phase: GamePhase;
  board: BoardGeometry;
  terrainSeed: number;            // 再生成用（任意）
  buildings: BuildingState[];
  roads: RoadState[];
  banditHexId: number;            // 一揆の起きているヘクスID
  players: Player[];
  currentPlayer: PlayerId;
  vassalDeck: VassalId[];          // 家臣山札（登用する順）
  dice: [number, number] | null;  // 直近の出目
  pendingTrade: PendingTrade | null;
  discardQueue: PlayerId[];       // 7のとき破棄が必要な人の待ち行列
  // 初期配置の進行管理
  setup: {
    order: PlayerId[];            // スネーク順（往復済みの完全列）
    index: number;                // order の現在位置
    pendingRoadFromVertex: number | null; // 砦を置いた直後、街道を置く制約用
  };
  winner: PlayerId | null;
  log: string[];                  // 画面下に出すイベントログ（任意）
}
