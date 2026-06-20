import { ResourceType, TerrainType, VassalId } from '../game/types';

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  timber: '木材',
  stone: '石',
  rice: '米',
  horse: '馬',
  iron: '鉄',
};

// コスト表示などで使う短い表記
export const RESOURCE_SHORT_LABELS: Record<ResourceType, string> = {
  timber: '木',
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

export const VASSAL_LABELS: Record<VassalId, string> = {
  fushin: '普請奉行', gunshi: '軍師', kaisen: '廻船問屋',
  daikan: '代官', kura: '蔵奉行', hatamoto: '旗本',
};

export const VASSAL_DESCRIPTIONS: Record<VassalId, string> = {
  fushin: '街道の建設で石が1少なくて済む。',
  gunshi: '略奪のとき相手から2枚奪う。',
  kaisen: 'すべての交易レートが1良くなる。',
  daikan: '自分の手番のはじめに米を1得る。',
  kura: '一揆のときの供出を免れる。',
  hatamoto: '常に威信+1。',
};

export const COLORS = {
  brandGreen: '#07814E',
  cream: '#FAF7F0',
  orange: '#C2541A',
};

// 例: { timber: 1, stone: 1 } -> "木1・石1"
export function formatCost(cost: Partial<Record<ResourceType, number>>): string {
  return Object.entries(cost)
    .map(([k, v]) => `${RESOURCE_SHORT_LABELS[k as ResourceType]}${v}`)
    .join('・');
}
