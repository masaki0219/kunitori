import React from 'react';
import { Circle, G } from 'react-native-svg';

const PIP_COUNT: Record<number, number> = {
  2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
};

// 数字チップ下の確率ドット
export function Pips({ token, cx, cy, color }: { token: number; cx: number; cy: number; color: string }) {
  const n = PIP_COUNT[token] ?? 0;
  if (n === 0) return null;
  const gap = 3;
  const startX = cx - ((n - 1) * gap) / 2;
  return (
    <G>
      {Array.from({ length: n }).map((_, i) => (
        <Circle key={i} cx={startX + i * gap} cy={cy} r={1.1} fill={color} />
      ))}
    </G>
  );
}

export default Pips;

// サイコロの目（1〜6）
const DIE_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.22], [0.75, 0.22], [0.25, 0.5], [0.75, 0.5], [0.25, 0.78], [0.75, 0.78]],
};

export function DiePips({ value, size, color }: { value: number; size: number; color: string }) {
  const layout = DIE_LAYOUTS[value] ?? [];
  return (
    <G>
      {layout.map(([fx, fy], i) => (
        <Circle key={i} cx={fx * size} cy={fy * size} r={size * 0.09} fill={color} />
      ))}
    </G>
  );
}
