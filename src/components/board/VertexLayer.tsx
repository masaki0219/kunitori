import React from 'react';
import { Circle } from 'react-native-svg';
import { BoardGeometry, BuildingState, Player } from '../../game/types';
import { PALETTE } from '../../config/theme';
import { CastleShape, FortShape } from '../icons/PieceShapes';

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
        const color = building ? players.find((p) => p.id === building.owner)?.color ?? PALETTE.ink : undefined;

        return (
          <React.Fragment key={v.id}>
            {isBuildable ? (
              <Circle
                cx={v.pos.x}
                cy={v.pos.y}
                r={9}
                fill={PALETTE.gold}
                opacity={0.55}
                onPress={onVertexPress ? () => onVertexPress(v.id) : undefined}
              />
            ) : null}
            {building ? (
              building.type === 'fort' ? (
                <FortShape x={v.pos.x} y={v.pos.y} color={color!} />
              ) : (
                <CastleShape x={v.pos.x} y={v.pos.y} color={color!} />
              )
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}
