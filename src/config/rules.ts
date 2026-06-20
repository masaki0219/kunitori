import { ResourceType } from '../game/types';

// 到達可能性維持のため当面10。12化はRUNBOOK §6に従い後で。
export const WIN_PRESTIGE = 10;

export const COSTS = {
  road:   { timber: 1, stone: 1 } as Partial<Record<ResourceType, number>>,
  fort:   { timber: 1, stone: 1, rice: 1, horse: 1 } as Partial<Record<ResourceType, number>>,
  castle: { rice: 2, iron: 3 } as Partial<Record<ResourceType, number>>,
  card:   { rice: 1, iron: 1, horse: 1 } as Partial<Record<ResourceType, number>>,
} as const;

export const PIECE_LIMITS = { road: 15, fort: 5, castle: 4 } as const;

export const PRESTIGE = { fort: 1, castle: 2, longestRoad: 2, largestArmy: 2, merit: 1 } as const;

export const LONGEST_ROAD_MIN = 5;
export const LARGEST_ARMY_MIN = 3;
export const HAND_LIMIT_FOR_DISCARD = 8; // これ以上で7のとき破棄
export const BANK_TRADE_RATE = 4;        // 4:1

// 数字チップ（18枚）
export const NUMBER_TOKENS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

// 地形の枚数（合計19）
export const TERRAIN_COUNTS = {
  forest: 4, pasture: 4, paddy: 4, quarry: 3, mine: 3, wasteland: 1,
} as const;

// 軍略カード山札（合計25）
export const CARD_DECK_COUNTS = {
  warlord: 14, merit: 5, construction: 2, harvest: 2, requisition: 2,
} as const;

export const PLAYER_COLORS = ['#C2541A', '#1F3A7A', '#5C8A3A', '#6B3FA0'];

export const AI_TRADE_LOOP_LIMIT = 4;

// 港のレート
export const PORT_RATES = { specific: 2, generic: 3 } as const;

// 港の構成：各資源の 2:1 を1つずつ（5個）＋ 汎用 3:1 を4個 = 合計9
export const SPECIFIC_PORT_RESOURCES: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];
export const GENERIC_PORT_COUNT = 4;
