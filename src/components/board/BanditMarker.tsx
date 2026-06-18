import React from 'react';
import { Hex } from '../../game/types';
import { BanditShape } from '../icons/PieceShapes';

interface Props {
  hex: Hex;
}

export default function BanditMarker({ hex }: Props) {
  return <BanditShape x={hex.center.x} y={hex.center.y - 6} />;
}
