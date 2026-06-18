import React from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { RESOURCE_GRADIENTS, PALETTE } from '../../config/theme';
import { RESOURCE_LABELS } from '../../config/labels';
import { ResourceType } from '../../game/types';

function Motif({ resource, w, h }: { resource: ResourceType; w: number; h: number }) {
  const cx = w / 2;
  const cy = h * 0.36;
  const color = 'rgba(255,255,255,0.75)';
  switch (resource) {
    case 'timber':
      return (
        <>
          <Rect x={cx - w * 0.26} y={cy - 2} width={w * 0.34} height={h * 0.1} rx={h * 0.05} fill={color} />
          <Rect x={cx - w * 0.1} y={cy + h * 0.07} width={w * 0.34} height={h * 0.1} rx={h * 0.05} fill={color} />
        </>
      );
    case 'stone':
      return (
        <Polygon points={`${cx - w * 0.22},${cy + h * 0.12} ${cx + w * 0.22},${cy + h * 0.12} ${cx + w * 0.14},${cy - h * 0.05} ${cx - w * 0.14},${cy - h * 0.05}`} fill={color} />
      );
    case 'rice':
      return (
        <>
          <Line x1={cx} y1={cy - h * 0.12} x2={cx} y2={cy + h * 0.14} stroke={color} strokeWidth={1.5} />
          {[-1, 1].map((s) =>
            [0, 1, 2].map((i) => (
              <Line
                key={`${s}-${i}`}
                x1={cx}
                y1={cy - h * 0.08 + i * h * 0.07}
                x2={cx + s * w * 0.18}
                y2={cy - h * 0.13 + i * h * 0.07}
                stroke={color}
                strokeWidth={1}
              />
            ))
          )}
        </>
      );
    case 'horse':
      return (
        <Path
          d={`M ${cx - w * 0.1} ${cy + h * 0.12} Q ${cx - w * 0.18} ${cy - h * 0.05} ${cx - w * 0.02} ${cy - h * 0.14}
              Q ${cx + w * 0.14} ${cy - h * 0.16} ${cx + w * 0.16} ${cy - h * 0.06}
              L ${cx + w * 0.06} ${cy + h * 0.1} Z`}
          fill={color}
        />
      );
    case 'iron':
      return (
        <Polygon points={`${cx - w * 0.22},${cy + h * 0.12} ${cx + w * 0.22},${cy + h * 0.12} ${cx + w * 0.12},${cy - h * 0.1} ${cx - w * 0.12},${cy - h * 0.1}`} fill={color} />
      );
    default:
      return null;
  }
}

export default function ResourceIcon({ resource, size = 28, count }: {
  resource: ResourceType; size?: number; count?: number;
}) {
  const w = size, h = size * 1.4, r = size * 0.18;
  const g = RESOURCE_GRADIENTS[resource];
  const id = `res-${resource}-${size}`;
  return (
    <Svg width={w} height={h + (count !== undefined ? 0 : 0)} viewBox={`0 0 ${w} ${h}`}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={g.top} />
          <Stop offset="1" stopColor={g.bottom} />
        </LinearGradient>
      </Defs>
      <Rect x={1} y={1} width={w - 2} height={h - 2} rx={r} fill={`url(#${id})`} stroke={PALETTE.ink} strokeWidth={1} />
      <Motif resource={resource} w={w} h={h} />
      <SvgText x={w / 2} y={h * 0.78} fill="#fff" fontSize={size * 0.42} fontWeight="800" textAnchor="middle">
        {RESOURCE_LABELS[resource]}
      </SvgText>
      {count !== undefined ? (
        <>
          <Circle cx={w - w * 0.18} cy={h - h * 0.1} r={size * 0.22} fill={PALETTE.gold} stroke={PALETTE.goldDark} strokeWidth={1} />
          <SvgText x={w - w * 0.18} y={h - h * 0.1 + size * 0.08} fill={PALETTE.wood900} fontSize={size * 0.26} fontWeight="800" textAnchor="middle">
            {count}
          </SvgText>
        </>
      ) : null}
    </Svg>
  );
}
