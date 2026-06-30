import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameState, PlayerId, ResourceType } from '../../game/types';
import { computePrestige } from '../../game/scoring';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';
import { AVATAR_IMAGES } from '../../config/assets';
import Avatar from '../icons/Avatar';
import ResourceIcon from '../icons/ResourceIcon';
import Vp from '../icons/Vp';
import StampBubble from './StampBubble';

interface Props {
  style?: StyleProp<ViewStyle>;
  state: GameState;
  viewerId: PlayerId;
  compact?: boolean;
}

const ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export default function PlayerHandPanel({ style, state, viewerId, compact }: Props) {
  const me = state.players.find((p) => p.id === viewerId);
  if (!me) return null;
  const points = computePrestige(state, me.id);
  const avatarSize = compact ? 32 : 40;
  const cardSize = compact ? 38 : 48;

  return (
    <View style={[styles.outer, style]}>
      <StampBubble seat={me.id} color={me.color} compact={compact} anchor="top" />
      <View style={styles.panel}>
        <View style={[styles.accent, { backgroundColor: PALETTE.gold }]} />

        <View style={styles.topRow}>
          <Avatar color={me.color} letter={me.name.slice(0, 1)} size={avatarSize} image={AVATAR_IMAGES[me.id] ?? null} />
          {!compact ? <Text style={styles.name} numberOfLines={1}>{me.name}</Text> : null}
          <View style={styles.scoreRow}>
            <Vp size={compact ? 12 : 14} />
            <Text style={styles.scoreText}>{points}</Text>
            <Ionicons name="star" size={compact ? 11 : 13} color={PALETTE.gold} style={{ marginLeft: SPACING.xs }} />
            <Text style={styles.scoreText}>{me.vassals.length}</Text>
          </View>
        </View>

        <View style={[styles.hand, { gap: compact ? SPACING.xs : SPACING.sm }]}>
          {ORDER.map((r) => (
            <View key={r} style={{ opacity: me.resources[r] > 0 ? 1 : 0.45 }}>
              <ResourceIcon resource={r} size={cardSize} count={me.resources[r]} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { ...ELEVATION.floating },
  panel: {
    flexDirection: 'column',
    backgroundColor: PALETTE.washi,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm, paddingLeft: SPACING.md, paddingRight: SPACING.sm,
    overflow: 'hidden',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  name: { ...TYPE.label, color: PALETTE.ink, maxWidth: 90 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  scoreText: { ...TYPE.caption, color: PALETTE.ink },
  hand: { flexDirection: 'row', alignItems: 'center' },
});
