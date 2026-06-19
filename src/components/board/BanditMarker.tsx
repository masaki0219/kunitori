import React from 'react';
import { Circle, Ellipse, G, Path } from 'react-native-svg';
import { Hex } from '../../game/types';

interface Props {
  hex: Hex;
}

export default function BanditMarker({ hex }: Props) {
  const { x: cx, y: cy } = hex.center;
  const dark = '#26242A';
  return (
    <G pointerEvents="none">
      <Ellipse cx={cx} cy={cy + 13} rx={10} ry={3.5} fill="#000" opacity={0.28} />
      {/* 胴体（裾広がり） */}
      <Path
        d={`M ${cx - 7} ${cy + 12} Q ${cx} ${cy + 14} ${cx + 7} ${cy + 12}
            L ${cx + 4} ${cy - 2} Q ${cx} ${cy - 6} ${cx - 4} ${cy - 2} Z`}
        fill={dark}
        stroke="#000"
        strokeWidth={0.5}
      />
      {/* 首・頭 */}
      <Circle cx={cx} cy={cy - 7} r={5} fill={dark} stroke="#000" strokeWidth={0.5} />
      <Ellipse cx={cx - 1.6} cy={cy - 8.5} rx={1.6} ry={2.4} fill="#fff" opacity={0.25} />
    </G>
  );
}
