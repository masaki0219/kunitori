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

  // 陸の外周（R）＋約1.2ヘクスぶん海を広げる。港のドック・マーカーが収まる帯幅を確保する
  const drawR = R + HEX_SIZE * 1.2;

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
