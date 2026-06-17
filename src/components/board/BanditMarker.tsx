import React from 'react';
import { Circle, Text as SvgText } from 'react-native-svg';
import { Hex } from '../../game/types';

interface Props {
  hex: Hex;
}

export default function BanditMarker({ hex }: Props) {
  return (
    <>
      <Circle cx={hex.center.x} cy={hex.center.y - 18} r={10} fill="#1A1A1A" stroke="#FAF7F0" strokeWidth={1.5} />
      <SvgText
        x={hex.center.x}
        y={hex.center.y - 14}
        fontSize={11}
        fill="#FAF7F0"
        textAnchor="middle"
      >
        盗
      </SvgText>
    </>
  );
}
