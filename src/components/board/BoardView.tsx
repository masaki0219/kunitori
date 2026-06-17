import React from 'react';
import { useWindowDimensions } from 'react-native';
import Svg from 'react-native-svg';
import { boardViewBox } from '../../game/board';
import { BoardGeometry, BuildingState, Player, RoadState } from '../../game/types';
import BanditMarker from './BanditMarker';
import HexTile from './HexTile';
import RoadLayer from './RoadLayer';
import VertexLayer from './VertexLayer';

interface Props {
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

export default function BoardView({
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
  const viewBox = boardViewBox(geo);
  const banditHex = geo.hexes.find((h) => h.id === banditHexId);
  const selectable = new Set(selectableHexIds ?? []);

  return (
    <Svg width={width} height={width} viewBox={viewBox}>
      {geo.hexes.map((h) => (
        <HexTile key={h.id} hex={h} onPress={onHexPress} selectable={selectable.has(h.id)} />
      ))}
      <RoadLayer geo={geo} roads={roads} players={players} buildableEdgeIds={buildableEdgeIds} onEdgePress={onEdgePress} />
      <VertexLayer geo={geo} buildings={buildings} players={players} buildableVertexIds={buildableVertexIds} onVertexPress={onVertexPress} />
      {banditHex ? <BanditMarker hex={banditHex} /> : null}
    </Svg>
  );
}
