import React from 'react';
import { Line } from 'react-native-svg';
import { BoardGeometry, Player, RoadState } from '../../game/types';

interface Props {
  geo: BoardGeometry;
  roads: RoadState[];
  players: Player[];
  buildableEdgeIds?: number[];
  onEdgePress?: (edgeId: number) => void;
}

export default function RoadLayer({ geo, roads, players, buildableEdgeIds, onEdgePress }: Props) {
  const buildable = new Set(buildableEdgeIds ?? []);

  return (
    <>
      {geo.edges.map((e) => {
        const road = roads.find((r) => r.edgeId === e.id);
        const isBuildable = buildable.has(e.id);
        const color = road ? players.find((p) => p.id === road.owner)?.color ?? '#000' : undefined;

        return (
          <React.Fragment key={e.id}>
            {isBuildable ? (
              <Line
                x1={e.pos.x1} y1={e.pos.y1} x2={e.pos.x2} y2={e.pos.y2}
                stroke="#FFD700" strokeWidth={10} strokeLinecap="round" opacity={0.45}
                onPress={onEdgePress ? () => onEdgePress(e.id) : undefined}
              />
            ) : null}
            {road ? (
              <Line
                x1={e.pos.x1} y1={e.pos.y1} x2={e.pos.x2} y2={e.pos.y2}
                stroke={color} strokeWidth={6} strokeLinecap="round"
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}
