import React from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { boardViewBox } from '../../game/board';
import { BoardGeometry, BuildingState, Player, RoadState, TerrainType } from '../../game/types';
import { PALETTE, TERRAIN_GRADIENTS } from '../../config/theme';
import BanditMarker from './BanditMarker';
import HexTile from './HexTile';
import RoadLayer from './RoadLayer';
import SeaIsland from './SeaIsland';
import VertexLayer from './VertexLayer';

interface Props {
  size?: number;
  geo: BoardGeometry;
  buildings: BuildingState[];
  roads: RoadState[];
  players: Player[];
  banditHexId: number;
  buildableVertexIds?: number[];
  buildableEdgeIds?: number[];
  selectableHexIds?: number[];
  onVertexPress?: (vertexId: number) => void;
  onEdgePress?: (edgeId: number) => void;
  onHexPress?: (hexId: number) => void;
}

const TERRAINS: TerrainType[] = ['forest', 'pasture', 'paddy', 'quarry', 'mine', 'wasteland'];

export default function BoardView({
  size,
  geo,
  buildings,
  roads,
  players,
  banditHexId,
  buildableVertexIds,
  buildableEdgeIds,
  selectableHexIds,
  onVertexPress,
  onEdgePress,
  onHexPress,
}: Props) {
  const { width } = useWindowDimensions();
  const side = size ?? width;
  const viewBox = boardViewBox(geo, 80); // 海の外周ぶん余白を確保
  const banditHex = geo.hexes.find((h) => h.id === banditHexId);
  const selectable = new Set(selectableHexIds ?? []);

  return (
    <Svg width={side} height={side} viewBox={viewBox}>
      <Defs>
        {TERRAINS.map((t) => (
          <LinearGradient key={t} id={`grad-${t}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={TERRAIN_GRADIENTS[t].top} />
            <Stop offset="1" stopColor={TERRAIN_GRADIENTS[t].bottom} />
          </LinearGradient>
        ))}
        <RadialGradient id="sea" cx="50%" cy="50%" r="65%">
          <Stop offset="0" stopColor={PALETTE.sea300} />
          <Stop offset="1" stopColor={PALETTE.sea700} />
        </RadialGradient>
      </Defs>

      <SeaIsland geo={geo} />
      {geo.hexes.map((h) => (
        <HexTile key={h.id} hex={h} onPress={onHexPress} selectable={selectable.has(h.id)} />
      ))}
      <RoadLayer geo={geo} roads={roads} players={players} buildableEdgeIds={buildableEdgeIds} onEdgePress={onEdgePress} />
      <VertexLayer geo={geo} buildings={buildings} players={players} buildableVertexIds={buildableVertexIds} onVertexPress={onVertexPress} />
      {banditHex ? <BanditMarker hex={banditHex} /> : null}
    </Svg>
  );
}
