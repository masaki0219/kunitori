import React from 'react';
import { Image as SvgImage } from 'react-native-svg';
import { HEX_SIZE } from '../../game/board';
import { BoardGeometry } from '../../game/types';
import { SEA_IMAGE } from '../../config/assets';

export default function SeaIsland({ geo }: { geo: BoardGeometry }) {
  const xs = geo.vertices.map((v) => v.pos.x);
  const ys = geo.vertices.map((v) => v.pos.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.max(...geo.vertices.map((v) => Math.hypot(v.pos.x - cx, v.pos.y - cy)));

  // 旧グラデ海の外周(R + HEX_SIZE*1.7)に少しだけ余白を足した半径で描く
  const drawR = R + HEX_SIZE * 1.9; // 現状値で ≈ 225（直径 ≈ 450）

  return (
    <SvgImage
      x={cx - drawR}
      y={cy - drawR}
      width={drawR * 2}
      height={drawR * 2}
      href={SEA_IMAGE}
      preserveAspectRatio="xMidYMid meet"
    />
  );
}
