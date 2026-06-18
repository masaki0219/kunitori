import React from 'react';
import { Polygon } from 'react-native-svg';
import { HEX_SIZE, hexCorners } from '../../game/board';
import { BoardGeometry } from '../../game/types';
import { PALETTE } from '../../config/theme';

export default function SeaIsland({ geo }: { geo: BoardGeometry }) {
  const xs = geo.vertices.map((v) => v.pos.x);
  const ys = geo.vertices.map((v) => v.pos.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.max(...geo.vertices.map((v) => Math.hypot(v.pos.x - cx, v.pos.y - cy)));
  const toPts = (r: number) => hexCorners({ x: cx, y: cy }, r).map((p) => `${p.x},${p.y}`).join(' ');
  return (
    <>
      <Polygon points={toPts(R + HEX_SIZE * 1.15)} fill="url(#sea)" strokeLinejoin="round" />
      <Polygon points={toPts(R + HEX_SIZE * 0.35)} fill={PALETTE.coast} opacity={0.9} strokeLinejoin="round" />
    </>
  );
}
