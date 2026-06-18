import React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { ImageSourcePropType, Image, View } from 'react-native';
import { PALETTE } from '../../config/theme';

interface Props {
  color: string;
  letter: string;
  size?: number;
  image?: ImageSourcePropType | null;
}

// 家紋風アバター：プレイヤー色の円＋金の縁＋頭文字（写真は使わない方針。assets.ts のスロットが
// 非null なら画像に差し替え可）
export default function Avatar({ color, letter, size = 32, image }: Props) {
  if (image) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        <Image source={image} style={{ width: size, height: size }} />
      </View>
    );
  }
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 1} fill={color} stroke={PALETTE.gold} strokeWidth={1.5} />
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill="none" stroke={PALETTE.washi} strokeWidth={0.8} opacity={0.5} />
      <SvgText
        x={size / 2}
        y={size / 2 + size * 0.12}
        fontSize={size * 0.42}
        fontWeight="800"
        fill="#fff"
        textAnchor="middle"
      >
        {letter}
      </SvgText>
    </Svg>
  );
}
