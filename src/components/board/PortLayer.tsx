import React from 'react';
import { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { BoardGeometry } from '../../game/types';
import { RESOURCE_LABELS } from '../../config/labels';
import { PALETTE } from '../../config/theme';

interface Props {
  geo: BoardGeometry;
}

const DOCK_COLOR = '#8A6B45';
const MARKER_W = 30;
const MARKER_H = 18;

export default function PortLayer({ geo }: Props) {
  return (
    <>
      {geo.ports.map((port) => {
        const [v1, v2] = port.vertexIds;
        const p1 = geo.vertices[v1]?.pos;
        const p2 = geo.vertices[v2]?.pos;
        if (!p1 || !p2) return null;
        const label = port.resource ? `${port.rate}:1 ${RESOURCE_LABELS[port.resource]}` : `${port.rate}:1`;

        return (
          <G key={port.id} pointerEvents="none">
            <Line x1={p1.x} y1={p1.y} x2={port.markerPos.x} y2={port.markerPos.y} stroke={DOCK_COLOR} strokeWidth={3} strokeLinecap="round" />
            <Line x1={p2.x} y1={p2.y} x2={port.markerPos.x} y2={port.markerPos.y} stroke={DOCK_COLOR} strokeWidth={3} strokeLinecap="round" />
            <Rect
              x={port.markerPos.x - MARKER_W / 2}
              y={port.markerPos.y - MARKER_H / 2}
              width={MARKER_W}
              height={MARKER_H}
              rx={5}
              fill={PALETTE.washi}
              stroke={PALETTE.ink}
              strokeWidth={1}
            />
            <SvgText
              x={port.markerPos.x}
              y={port.markerPos.y + 3.5}
              fill={PALETTE.ink}
              fontSize={9}
              fontWeight="700"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          </G>
        );
      })}
    </>
  );
}
