import React from 'react';
import { Circle, Ellipse, G, Line, Path, Polygon } from 'react-native-svg';
import { TerrainType } from '../../game/types';
import { TERRAIN_GRADIENTS, darken } from '../../config/theme';

interface Props {
  terrain: TerrainType;
  cx: number;
  cy: number;
  scale?: number;
}

// 数字チップ（中心 r≈14.5）に重ならないよう、要素は外周寄り（中心から距離18以上）に散らす。
export default function TerrainMotif({ terrain, cx, cy, scale = 1 }: Props) {
  const motif = TERRAIN_GRADIENTS[terrain].motif;
  const motifDark = darken(motif, 0.25);
  const opacity = 0.7;

  if (terrain === 'forest') {
    const trees: [number, number, number][] = [
      [-20, -10, 1.0], [-9, -22, 0.85], [10, -20, 0.9],
      [21, -6, 0.75], [-22, 8, 0.8], [4, 21, 0.7], [20, 16, 0.65],
    ];
    return (
      <G opacity={opacity}>
        {trees.map(([dx, dy, s], i) => {
          const x = cx + dx * scale, y = cy + dy * scale, h = 11 * s, w = 7 * s;
          const fill = i % 2 === 0 ? motif : motifDark;
          return <Polygon key={i} points={`${x - w / 2},${y + h / 2} ${x},${y - h / 2} ${x + w / 2},${y + h / 2}`} fill={fill} />;
        })}
      </G>
    );
  }
  if (terrain === 'mine') {
    return (
      <G opacity={opacity}>
        <Polygon points={`${cx - 24},${cy - 4} ${cx - 14},${cy - 19} ${cx - 4},${cy - 4}`} fill={motif} />
        <Polygon points={`${cx + 2},${cy - 2} ${cx + 14},${cy - 17} ${cx + 26},${cy - 2}`} fill={motifDark} />
        <Polygon points={`${cx - 17},${cy - 16} ${cx - 14},${cy - 22} ${cx - 11},${cy - 16}`} fill="#fff" opacity={0.5} />
        <Line x1={cx - 20} y1={cy + 4} x2={cx - 4} y2={cy + 12} stroke={motifDark} strokeWidth={1.4} />
        <Line x1={cx + 4} y1={cy + 12} x2={cx + 20} y2={cy + 6} stroke={motifDark} strokeWidth={1.4} />
      </G>
    );
  }
  if (terrain === 'paddy') {
    const rows = [-16, -9, -2, 5, 12, 19];
    return (
      <G opacity={opacity}>
        {rows.map((dy, i) => (
          <Line key={i} x1={cx - 22} y1={cy + dy} x2={cx + 22} y2={cy + dy} stroke={i % 2 === 0 ? motif : motifDark} strokeWidth={1.6} />
        ))}
        {[-18, -6, 6, 18].map((dx, i) => (
          <Circle key={`s${i}`} cx={cx + dx} cy={cy + (i % 2 === 0 ? -16 : 19)} r={1.4} fill={motifDark} />
        ))}
      </G>
    );
  }
  if (terrain === 'quarry') {
    const rocks: [number, number, number][] = [
      [-20, -8, 4.2], [-8, -18, 3.4], [10, -14, 3.8], [21, -2, 3.0], [-2, 16, 4.6], [18, 17, 3.2],
    ];
    return (
      <G opacity={opacity}>
        {rocks.map(([dx, dy, r], i) => (
          <Circle key={i} cx={cx + dx} cy={cy + dy} r={r} fill={i % 2 === 0 ? motif : motifDark} />
        ))}
      </G>
    );
  }
  if (terrain === 'pasture') {
    const blades = [-22, -16, -10, 10, 16, 22];
    return (
      <G opacity={opacity}>
        {blades.map((dx, i) => (
          <Line key={i} x1={cx + dx} y1={cy + 18} x2={cx + dx} y2={cy + (i % 2 === 0 ? 6 : 9)} stroke={motif} strokeWidth={1.6} />
        ))}
        {/* 小さな馬の体 */}
        <Ellipse cx={cx} cy={cy - 10} rx={9} ry={5} fill={motifDark} />
        <Line x1={cx - 6} y1={cy - 6} x2={cx - 7} y2={cy + 1} stroke={motifDark} strokeWidth={1.8} />
        <Line x1={cx + 5} y1={cy - 6} x2={cx + 6} y2={cy + 1} stroke={motifDark} strokeWidth={1.8} />
      </G>
    );
  }
  if (terrain === 'wasteland') {
    return (
      <G opacity={0.5}>
        <Path d={`M ${cx - 20} ${cy - 8} L ${cx - 10} ${cy - 2} L ${cx - 2} ${cy - 10} L ${cx + 8} ${cy - 4}`} stroke={motif} strokeWidth={1.2} fill="none" />
        <Path d={`M ${cx - 14} ${cy + 10} L ${cx - 4} ${cy + 16} L ${cx + 8} ${cy + 9} L ${cx + 18} ${cy + 15}`} stroke={motifDark} strokeWidth={1.2} fill="none" />
        <Circle cx={cx + 18} cy={cy - 6} r={2} fill={motif} />
        <Circle cx={cx - 20} cy={cy + 14} r={1.6} fill={motifDark} />
      </G>
    );
  }
  return null;
}
