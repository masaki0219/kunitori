import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameState, ResourceType } from '../../game/types';
import { computePrestige } from '../../game/scoring';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';
import { AVATAR_IMAGES } from '../../config/assets';
import Avatar from '../icons/Avatar';
import ResourceIcon from '../icons/ResourceIcon';
import Vp from '../icons/Vp';

interface Props {
  style?: StyleProp<ViewStyle>;
  state: GameState;
  compact?: boolean;
}

const ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export default function PlayerHandPanel({ style, state, compact }: Props) {
  const me = state.players.find((p) => p.id === state.currentPlayer);
  if (!me) return null;
  const points = computePrestige(state, me.id);
  const avatarSize = compact ? 32 : 40;
  const cardSize = compact ? 38 : 48;

  return (
    <View style={[styles.panel, style]}>
      <View style={[styles.accent, { backgroundColor: PALETTE.gold }]} />

      <View style={styles.topRow}>
        <Avatar color={me.color} letter={me.name.slice(0, 1)} size={avatarSize} image={AVATAR_IMAGES[me.id] ?? null} />
        {!compact ? <Text style={styles.name} numberOfLines={1}>{me.name}</Text> : null}
        <View style={styles.scoreRow}>
          <Vp size={compact ? 12 : 14} />
          <Text style={styles.scoreText}>{points}</Text>
          <Ionicons name="star" size={compact ? 11 : 13} color={PALETTE.gold} style={{ marginLeft: SPACING.xs }} />
          <Text style={styles.scoreText}>{me.cards.length}</Text>
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
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'column',
    backgroundColor: PALETTE.washi,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm, paddingLeft: SPACING.md, paddingRight: SPACING.sm,
    overflow: 'hidden',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    ...ELEVATION.floating,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  name: { ...TYPE.label, color: PALETTE.ink, maxWidth: 90 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  scoreText: { ...TYPE.caption, color: PALETTE.ink },
  hand: { flexDirection: 'row', alignItems: 'center' },
});
