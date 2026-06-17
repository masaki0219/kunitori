import { CardType, ResourceType, TerrainType } from '../game/types';

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  timber: '木材',
  stone: '石',
  rice: '米',
  horse: '馬',
  iron: '鉄',
};

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  forest: '山林',
  quarry: '石場',
  paddy: '田',
  pasture: '牧場',
  mine: '鉱山',
  wasteland: '荒地',
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  forest: '#2E5E3A',
  pasture: '#8FB36B',
  paddy: '#D9A441',
  quarry: '#9A8478',
  mine: '#5B6066',
  wasteland: '#C9B89A',
};

export const CARD_LABELS: Record<CardType, string> = {
  warlord: '武将',
  merit: '軍功',
  construction: '普請',
  harvest: '豊作',
  requisition: '徴発',
};

export const CARD_DESCRIPTIONS: Record<CardType, string> = {
  warlord: '野盗を移動し、隣接する相手から1枚略奪する。',
  merit: '隠し勝利点+1。引いた時点で加点（プレイ不要）。',
  construction: '街道を2本まで無料で建設できる。',
  harvest: '好きな資源を合計2個もらう。',
  requisition: '資源を1種指定し、他の全プレイヤーが持つその資源を全部獲得する。',
};

export const COLORS = {
  brandGreen: '#07814E',
  cream: '#FAF7F0',
  orange: '#C2541A',
};
