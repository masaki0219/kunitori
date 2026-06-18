import React from 'react';
import { G, Line, Path, Polygon, Circle } from 'react-native-svg';
import { TerrainType } from '../../game/types';
import { TERRAIN_GRADIENTS } from '../../config/theme';

interface Props {
  terrain: TerrainType;
  cx: number;
  cy: number;
  scale?: number;
}

// ヘクス中心に薄く重ねる地形モチーフ。主要地形のみ実装、残りは未描画でも崩れない。
export default function TerrainMotif({ terrain, cx, cy, scale = 1 }: Props) {
  const motif = TERRAIN_GRADIENTS[terrain].motif;
  const opacity = 0.55;
  const y = cy - 14 * scale; // 数字チップの上に重ならないよう少し上に

  if (terrain === 'forest') {
    return (
      <G opacity={opacity}>
        <Polygon points={`${cx - 11},${y + 6} ${cx - 5},${y - 6} ${cx + 1},${y + 6}`} fill={motif} />
        <Polygon points={`${cx - 2},${y + 7} ${cx + 4},${y - 8} ${cx + 10},${y + 7}`} fill={motif} />
      </G>
    );
  }
  if (terrain === 'mine') {
    return (
      <G opacity={opacity}>
        <Polygon points={`${cx - 10},${y + 6} ${cx - 3},${y - 7} ${cx + 4},${y + 6}`} fill={motif} />
        <Polygon points={`${cx - 1},${y + 6} ${cx + 6},${y - 5} ${cx + 12},${y + 6}`} fill={motif} />
        <Polygon points={`${cx - 5},${y - 9} ${cx - 3},${y - 13} ${cx - 1},${y - 9}`} fill={motif} />
      </G>
    );
  }
  if (terrain === 'paddy') {
    return (
      <G opacity={opacity}>
        <Line x1={cx - 11} y1={y - 4} x2={cx + 11} y2={y - 4} stroke={motif} strokeWidth={1.5} />
        <Line x1={cx - 11} y1={y} x2={cx + 11} y2={y} stroke={motif} strokeWidth={1.5} />
        <Line x1={cx - 11} y1={y + 4} x2={cx + 11} y2={y + 4} stroke={motif} strokeWidth={1.5} />
      </G>
    );
  }
  if (terrain === 'quarry') {
    return (
      <G opacity={opacity}>
        <Circle cx={cx - 6} cy={y + 2} r={3.2} fill={motif} />
        <Circle cx={cx + 1} cy={y - 1} r={3.6} fill={motif} />
        <Circle cx={cx + 7} cy={y + 2} r={2.8} fill={motif} />
      </G>
    );
  }
  if (terrain === 'pasture') {
    return (
      <G opacity={opacity}>
        <Line x1={cx - 8} y1={y + 6} x2={cx - 8} y2={y - 2} stroke={motif} strokeWidth={1.4} />
        <Line x1={cx - 3} y1={y + 6} x2={cx - 3} y2={y - 4} stroke={motif} strokeWidth={1.4} />
        <Line x1={cx + 2} y1={y + 6} x2={cx + 2} y2={y - 3} stroke={motif} strokeWidth={1.4} />
        <Line x1={cx + 7} y1={y + 6} x2={cx + 7} y2={y - 2} stroke={motif} strokeWidth={1.4} />
      </G>
    );
  }
  if (terrain === 'wasteland') {
    return (
      <G opacity={0.4}>
        <Path d={`M ${cx - 9} ${y} L ${cx - 2} ${y + 4} L ${cx + 3} ${y - 1} L ${cx + 10} ${y + 3}`} stroke={motif} strokeWidth={1} fill="none" />
      </G>
    );
  }
  return null;
}
