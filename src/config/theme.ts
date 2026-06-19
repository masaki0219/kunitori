import { TerrainType, ResourceType } from '../game/types';

// ---- 基本色 ----
export const PALETTE = {
  wood900: '#241710', wood700: '#3E2718', wood500: '#5C3A22', wood300: '#7A4E2E',
  sea700: '#1A5C8C', sea500: '#2F8FCB', sea300: '#54B0E8', coast: '#E8DCC0',
  washi: '#F3E9D2', washiDark: '#E2D3B0', ink: '#2B2520', inkSoft: '#5A5048',
  gold: '#C9A24B', goldLight: '#E6C667', goldDark: '#9A7B2E',
  vermilion: '#B23A2E', vermilionLight: '#C8503F', brandGreen: '#07814E',
} as const;

// ---- 地形グラデ（top→bottom）＋モチーフ色 ----
export const TERRAIN_GRADIENTS: Record<TerrainType, { top: string; bottom: string; motif: string }> = {
  forest:    { top: '#3C7A4A', bottom: '#234A2D', motif: '#1B3A22' },
  pasture:   { top: '#A6C97F', bottom: '#6E9152', motif: '#5A7A40' },
  paddy:     { top: '#E8B85A', bottom: '#BE8C2E', motif: '#8A6418' },
  quarry:    { top: '#B09A8C', bottom: '#7E6A5E', motif: '#5E4F45' },
  mine:      { top: '#6E747B', bottom: '#474C52', motif: '#2F343A' },
  wasteland: { top: '#DBCBAE', bottom: '#B0A084', motif: '#8E7E64' },
};

// ---- 資源カード色（top→bottom）----
export const RESOURCE_GRADIENTS: Record<ResourceType, { top: string; bottom: string }> = {
  timber: { top: '#3C7A4A', bottom: '#234A2D' },
  stone:  { top: '#A2948A', bottom: '#6E625A' },
  rice:   { top: '#E8B85A', bottom: '#B98A2C' },
  horse:  { top: '#A06E48', bottom: '#6E462C' },
  iron:   { top: '#6B7680', bottom: '#434C54' },
};

// ---- 資源カード色（base/deep。UI_07 §6 のミニカード用）----
export const RESOURCE_COLORS: Record<ResourceType, { base: string; deep: string }> = {
  timber: { base: '#3E7D4F', deep: '#27583A' },
  stone:  { base: '#A9A29B', deep: '#7C736B' },
  rice:   { base: '#E0B450', deep: '#B98A2E' },
  horse:  { base: '#C49A6C', deep: '#9A7444' },
  iron:   { base: '#5C6470', deep: '#3C434E' },
};

// ---- タイポ ----
export const TYPE = {
  display: { fontSize: 30, fontWeight: '800' as const },
  h1: { fontSize: 22, fontWeight: '700' as const },
  h2: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
  caption: { fontSize: 10, fontWeight: '600' as const },
  token: { fontSize: 15, fontWeight: '800' as const },
};

// ---- 建設ドックのボタン色（街道/砦/城/交易/カード）----
export const ACTION_COLORS = {
  road: '#2F6FA8',
  fort: '#2E7D4F',
  castle: '#6B4E9A',
  trade: '#1F8A8A',
  card: '#9A6B3E',
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const RADIUS  = { sm: 6, md: 10, lg: 16, xl: 22, pill: 999 } as const;
export const BORDER  = { hair: 1, thin: 1.5, thick: 3 } as const;

export const ELEVATION = {
  card:     { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8,  shadowOffset: { width: 0, height: 3 }, elevation: 5 },
  floating: { shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  inset:    { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 3,  shadowOffset: { width: 0, height: 1 }, elevation: 2 },
} as const;

// ---- 色ユーティリティ ----
// 駒の影色などに使う。amount=0.25 で 25% 暗く。
export function darken(hex: string, amount = 0.25): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r * (1 - amount)); g = Math.round(g * (1 - amount)); b = Math.round(b * (1 - amount));
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
export function lighten(hex: string, amount = 0.2): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * amount); g = Math.round(g + (255 - g) * amount); b = Math.round(b + (255 - b) * amount);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
