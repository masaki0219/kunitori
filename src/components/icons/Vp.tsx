import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { PALETTE } from '../../config/theme';

// 威信アイコン：金の盾
export default function Vp({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16">
      <Path
        d="M8 1 L14 3 V8 C14 12 11 14.5 8 15.5 C5 14.5 2 12 2 8 V3 Z"
        fill={PALETTE.gold}
        stroke={PALETTE.goldDark}
        strokeWidth={0.8}
      />
    </Svg>
  );
}
