import React from 'react';
import { Ellipse, Path } from 'react-native-svg';
import { PALETTE, darken, lighten } from '../../config/theme';

// 砦（fort）— 小さな櫓。底辺中央が (x,y)。
export function FortShape({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <Ellipse cx={x} cy={y + 1} rx={8} ry={2.5} fill="#000" opacity={0.3} />
      <Path
        d={`M ${x - 7} ${y} L ${x - 7} ${y - 8}
            L ${x - 4} ${y - 8} L ${x - 4} ${y - 11} L ${x - 1.5} ${y - 11} L ${x - 1.5} ${y - 8}
            L ${x + 1.5} ${y - 8} L ${x + 1.5} ${y - 11} L ${x + 4} ${y - 11} L ${x + 4} ${y - 8}
            L ${x + 7} ${y - 8} L ${x + 7} ${y} Z`}
        fill={color}
        stroke={PALETTE.ink}
        strokeWidth={1}
      />
      <Path
        d={`M ${x - 7} ${y - 8} L ${x + 7} ${y - 8}`}
        stroke={lighten(color)}
        strokeWidth={1}
        opacity={0.6}
      />
    </>
  );
}

// 城（castle）— 天守風。砦より一回り大きい。
export function CastleShape({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <Ellipse cx={x} cy={y + 1} rx={12} ry={3} fill="#000" opacity={0.3} />
      <Path
        d={`M ${x - 11} ${y} L ${x - 11} ${y - 9}
            L ${x - 7} ${y - 9} L ${x - 7} ${y - 12} L ${x - 4} ${y - 12} L ${x - 4} ${y - 9}
            L ${x - 1} ${y - 9} L ${x - 1} ${y - 12} L ${x + 1} ${y - 12} L ${x + 1} ${y - 9}
            L ${x + 4} ${y - 9} L ${x + 4} ${y - 12} L ${x + 7} ${y - 12} L ${x + 7} ${y - 9}
            L ${x + 11} ${y - 9} L ${x + 11} ${y} Z`}
        fill={color}
        stroke={PALETTE.ink}
        strokeWidth={1}
      />
      <Path
        d={`M ${x - 4} ${y - 12} L ${x - 3} ${y - 19} L ${x + 3} ${y - 19} L ${x + 4} ${y - 12} Z`}
        fill={color}
        stroke={PALETTE.ink}
        strokeWidth={1}
      />
      <Path
        d={`M ${x - 4.5} ${y - 19} L ${x} ${y - 23} L ${x + 4.5} ${y - 19} Z`}
        fill={darken(color, 0.2)}
        stroke={PALETTE.ink}
        strokeWidth={1}
      />
    </>
  );
}
