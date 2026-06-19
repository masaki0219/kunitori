// 画像を用意したら require を有効化。null のままなら SVG 描画にフォールバック。
import { TerrainType, ResourceType } from '../game/types';
import { ImageSourcePropType } from 'react-native';

export const TERRAIN_IMAGES: Record<TerrainType, ImageSourcePropType | null> = {
  forest: require('../../assets/terrain/forest.png'),
  pasture: require('../../assets/terrain/pasture.png'),
  paddy: require('../../assets/terrain/paddy.png'),
  quarry: require('../../assets/terrain/quarry.png'),
  mine: require('../../assets/terrain/mine.png'),
  wasteland: require('../../assets/terrain/wasteland.png'),
};

export const RESOURCE_IMAGES: Record<ResourceType, ImageSourcePropType | null> = {
  timber: null, stone: null, rice: null, horse: null, iron: null,
};

export const AVATAR_IMAGES: (ImageSourcePropType | null)[] = [null, null, null, null];
