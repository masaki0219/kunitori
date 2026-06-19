import React from 'react';
import { Polygon } from 'react-native-svg';
import { HEX_SIZE } from '../../game/board';
import { BoardGeometry } from '../../game/types';
import { PALETTE } from '../../config/theme';

export default function SeaIsland({ geo }: { geo: BoardGeometry }) {
  const xs = geo.vertices.map((v) => v.pos.x);
  const ys = geo.vertices.map((v) => v.pos.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.max(...geo.vertices.map((v) => Math.hypot(v.pos.x - cx, v.pos.y - cy)));

  // 決定的なゆらぎで島の輪郭を作る（毎フレーム同じ形。揺らぎを抑えて多角形寄りに整える）
  const blob = (r: number, jitter: number) => {
    const n = 20, pts: string[] = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n;
      const rr = r + Math.sin(i * 1.7) * jitter + Math.cos(i * 0.9) * jitter * 0.6;
      pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`);
    }
    return pts.join(' ');
  };

  return (
    <>
      <Polygon points={blob(R + HEX_SIZE * 1.7, HEX_SIZE * 0.25)} fill="url(#sea)" />
      <Polygon points={blob(R + HEX_SIZE * 0.45, HEX_SIZE * 0.15)} fill={PALETTE.coast} opacity={0.95} />
    </>
  );
}
