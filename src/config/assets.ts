// 画像を用意したら require を有効化。null のままなら SVG 描画にフォールバック。
import { TerrainType, ResourceType } from '../game/types';
import { ImageSourcePropType } from 'react-native';

export const TERRAIN_IMAGES: Record<TerrainType, ImageSourcePropType | null> = {
  forest: require('../../assets/terrain2/forest.png'),
  pasture: require('../../assets/terrain2/pasture.png'),
  paddy: require('../../assets/terrain2/paddy.png'),
  quarry: require('../../assets/terrain2/quarry.png'),
  mine: require('../../assets/terrain2/mine.png'),
  wasteland: require('../../assets/terrain2/wasteland.png'),
};

export const RESOURCE_IMAGES: Record<ResourceType, ImageSourcePropType | null> = {
  timber: null, stone: null, rice: null, horse: null, iron: null,
};

export const AVATAR_IMAGES: (ImageSourcePropType | null)[] = [null, null, null, null];

// 盤面・背景テクスチャ
export const TABLE_IMAGE: ImageSourcePropType = require('../../assets/table/table-wood.png');
export const SEA_IMAGE: ImageSourcePropType = require('../../assets/board/sea.png');

// タイトル画面の背景イラスト
export const TITLE_BG_IMAGE: ImageSourcePropType = require('../../assets/title/title-bg.png');
