import React from 'react';
import { Circle, Polygon, Text as SvgText } from 'react-native-svg';
import { TERRAIN_COLORS } from '../../config/labels';
import { hexCorners } from '../../game/board';
import { Hex } from '../../game/types';

interface Props {
  hex: Hex;
  onPress?: (hexId: number) => void;
  selectable?: boolean;
}

export default function HexTile({ hex, onPress, selectable }: Props) {
  const corners = hexCorners(hex.center);
  const points = corners.map((c) => `${c.x},${c.y}`).join(' ');
  const isRedNumber = hex.token === 6 || hex.token === 8;

  return (
    <>
      <Polygon
        points={points}
        fill={TERRAIN_COLORS[hex.terrain]}
        stroke="#3a2f1f"
        strokeWidth={1.5}
        onPress={selectable && onPress ? () => onPress(hex.id) : undefined}
        opacity={selectable ? 0.85 : 1}
      />
      {selectable ? (
        <Polygon points={points} fill="#FFD700" opacity={0.25} onPress={onPress ? () => onPress(hex.id) : undefined} />
      ) : null}
      {hex.token !== null ? (
        <>
          <Circle cx={hex.center.x} cy={hex.center.y} r={12} fill="#FAF7F0" stroke="#3a2f1f" strokeWidth={1} />
          <SvgText
            x={hex.center.x}
            y={hex.center.y + 4}
            fontSize={13}
            fontWeight="bold"
            fill={isRedNumber ? '#C0392B' : '#222'}
            textAnchor="middle"
          >
            {hex.token}
          </SvgText>
        </>
      ) : null}
    </>
  );
}
