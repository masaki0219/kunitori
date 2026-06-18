import React from 'react';
import { Circle, Polygon, Text as SvgText } from 'react-native-svg';
import { hexCorners } from '../../game/board';
import { Hex } from '../../game/types';
import { PALETTE } from '../../config/theme';
import Pips from '../icons/Pips';
import TerrainMotif from '../icons/TerrainMotif';

interface Props {
  hex: Hex;
  onPress?: (hexId: number) => void;
  selectable?: boolean;
}

export default function HexTile({ hex, onPress, selectable }: Props) {
  const corners = hexCorners(hex.center);
  const points = corners.map((c) => `${c.x},${c.y}`).join(' ');
  const isRedNumber = hex.token === 6 || hex.token === 8;
  const { x: cx, y: cy } = hex.center;

  return (
    <>
      <Polygon
        points={points}
        fill={`url(#grad-${hex.terrain})`}
        stroke={PALETTE.wood700}
        strokeWidth={2}
        strokeLinejoin="round"
        onPress={selectable && onPress ? () => onPress(hex.id) : undefined}
        opacity={selectable ? 0.85 : 1}
      />
      <TerrainMotif terrain={hex.terrain} cx={cx} cy={cy} />
      {selectable ? (
        <Polygon
          points={points}
          fill={PALETTE.gold}
          opacity={0.28}
          stroke={PALETTE.gold}
          strokeWidth={3}
          strokeDasharray="4 3"
          onPress={onPress ? () => onPress(hex.id) : undefined}
        />
      ) : null}
      {hex.token !== null ? (
        <>
          <Circle cx={cx} cy={cy + 1} r={14} fill={PALETTE.wood700} opacity={0.4} />
          <Circle cx={cx} cy={cy} r={14} fill={PALETTE.washi} stroke={PALETTE.wood700} strokeWidth={1} />
          <SvgText
            x={cx}
            y={cy + 3}
            fontSize={15}
            fontWeight="800"
            fill={isRedNumber ? PALETTE.vermilion : PALETTE.ink}
            textAnchor="middle"
          >
            {hex.token}
          </SvgText>
          <Pips token={hex.token} cx={cx} cy={cy + 9} color={isRedNumber ? PALETTE.vermilion : PALETTE.ink} />
        </>
      ) : null}
    </>
  );
}
