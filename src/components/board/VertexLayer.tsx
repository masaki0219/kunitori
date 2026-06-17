import React from 'react';
import { Circle, Polygon } from 'react-native-svg';
import { BoardGeometry, BuildingState, Player } from '../../game/types';

interface Props {
  geo: BoardGeometry;
  buildings: BuildingState[];
  players: Player[];
  buildableVertexIds?: number[];
  onVertexPress?: (vertexId: number) => void;
}

export default function VertexLayer({ geo, buildings, players, buildableVertexIds, onVertexPress }: Props) {
  const buildable = new Set(buildableVertexIds ?? []);

  return (
    <>
      {geo.vertices.map((v) => {
        const building = buildings.find((b) => b.vertexId === v.id);
        const isBuildable = buildable.has(v.id);
        const color = building ? players.find((p) => p.id === building.owner)?.color ?? '#000' : undefined;

        return (
          <React.Fragment key={v.id}>
            {isBuildable ? (
              <Circle
                cx={v.pos.x}
                cy={v.pos.y}
                r={9}
                fill="#FFD700"
                opacity={0.55}
                onPress={onVertexPress ? () => onVertexPress(v.id) : undefined}
              />
            ) : null}
            {building ? (
              building.type === 'fort' ? (
                <Circle cx={v.pos.x} cy={v.pos.y} r={6} fill={color} stroke="#222" strokeWidth={1} />
              ) : (
                <Polygon
                  points={`${v.pos.x},${v.pos.y - 8} ${v.pos.x + 7},${v.pos.y} ${v.pos.x},${v.pos.y + 8} ${v.pos.x - 7},${v.pos.y}`}
                  fill={color}
                  stroke="#222"
                  strokeWidth={1}
                />
              )
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}
