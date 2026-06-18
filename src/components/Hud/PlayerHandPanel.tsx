import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GameState, ResourceType } from '../../game/types';
import { computePoints } from '../../game/scoring';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';
import ResourceIcon from '../icons/ResourceIcon';
import Vp from '../icons/Vp';

interface Props {
  style?: StyleProp<ViewStyle>;
  state: GameState;
}

const ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export default function PlayerHandPanel({ style, state }: Props) {
  const me = state.players.find((p) => p.id === state.currentPlayer);
  if (!me) return null;
  const points = computePoints(state, me.id);

  return (
    <View style={[styles.panel, style]}>
      <View style={[styles.accent, { backgroundColor: PALETTE.gold }]} />
      <View style={styles.left}>
        <View style={[styles.avatar, { backgroundColor: me.color }]}>
          <Text style={styles.avatarText}>{me.name.slice(0, 1)}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{me.name}</Text>
        <View style={styles.scoreRow}>
          <Vp size={14} />
          <Text style={styles.scoreText}>{points}</Text>
          <Ionicons name="star" size={13} color={PALETTE.gold} style={{ marginLeft: SPACING.sm }} />
          <Text style={styles.scoreText}>{me.cards.length}</Text>
        </View>
      </View>
      <View style={styles.hand}>
        {ORDER.map((r) => (
          <View key={r} style={{ opacity: me.resources[r] > 0 ? 1 : 0.45 }}>
            <ResourceIcon resource={r} size={36} count={me.resources[r]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    backgroundColor: PALETTE.washi,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    overflow: 'hidden',
    ...ELEVATION.floating,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  left: { alignItems: 'center', justifyContent: 'center', marginLeft: SPACING.xs, marginRight: SPACING.md, width: 64 },
  avatar: { width: 40, height: 40, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  name: { ...TYPE.label, color: PALETTE.ink, marginTop: 2, maxWidth: 64 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 3 },
  scoreText: { ...TYPE.caption, color: PALETTE.ink },
  hand: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
});
