import React from 'react';
import { Line } from 'react-native-svg';
import { BoardGeometry, Player, RoadState } from '../../game/types';
import { PALETTE, darken } from '../../config/theme';

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
        const color = road ? players.find((p) => p.id === road.owner)?.color ?? PALETTE.ink : undefined;

        return (
          <React.Fragment key={e.id}>
            {isBuildable ? (
              <Line
                x1={e.pos.x1} y1={e.pos.y1} x2={e.pos.x2} y2={e.pos.y2}
                stroke={PALETTE.gold} strokeWidth={11} strokeLinecap="round" opacity={0.5}
                onPress={onEdgePress ? () => onEdgePress(e.id) : undefined}
              />
            ) : null}
            {road ? (
              <>
                <Line
                  x1={e.pos.x1} y1={e.pos.y1} x2={e.pos.x2} y2={e.pos.y2}
                  stroke={darken(color!, 0.35)} strokeWidth={9} strokeLinecap="round"
                />
                <Line
                  x1={e.pos.x1} y1={e.pos.y1} x2={e.pos.x2} y2={e.pos.y2}
                  stroke={color} strokeWidth={5} strokeLinecap="round"
                />
              </>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}
