// 画像を用意したら require を有効化。null のままなら SVG 描画にフォールバック。
import { TerrainType, ResourceType } from '../game/types';
import { ImageSourcePropType } from 'react-native';

export const TERRAIN_IMAGES: Record<TerrainType, ImageSourcePropType | null> = {
  forest: null, pasture: null, paddy: null, quarry: null, mine: null, wasteland: null,
  // 例) forest: require('../../assets/terrain/forest.png'),
};

export const RESOURCE_IMAGES: Record<ResourceType, ImageSourcePropType | null> = {
  timber: null, stone: null, rice: null, horse: null, iron: null,
};

export const AVATAR_IMAGES: (ImageSourcePropType | null)[] = [null, null, null, null];
