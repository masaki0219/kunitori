import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { GameState } from '../../game/types';
import { countResources } from '../../game/resources';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION, BORDER } from '../../config/theme';
import { AVATAR_IMAGES } from '../../config/assets';
import Avatar from '../icons/Avatar';
import Vp from '../icons/Vp';

interface Props {
  state: GameState;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

// 表示専用：対戦相手には公開情報だけから計算した点を見せる（軍功などの隠し点は含めない）
function visiblePoints(state: GameState, id: number): number {
  const forts = state.buildings.filter((b) => b.owner === id && b.type === 'fort').length;
  const castles = state.buildings.filter((b) => b.owner === id && b.type === 'castle').length;
  const lr = state.longestRoadHolder === id ? 2 : 0;
  const la = state.largestArmyHolder === id ? 2 : 0;
  return forts * 1 + castles * 2 + lr + la;
}

export default function PlayerPanel({ state, style, compact }: Props) {
  const players = state.players.filter((p) => p.id !== state.currentPlayer);
  const avatarSize = compact ? 24 : 30;

  return (
    <View style={[styles.rail, style]}>
      {players.map((p) => {
        const isTurn = p.id === state.currentPlayer;
        const hasLongestRoad = state.longestRoadHolder === p.id;
        const hasLargestArmy = state.largestArmyHolder === p.id;
        const handCount = countResources(p.resources);
        return (
          <View key={p.id} style={[styles.card, { borderLeftColor: p.color }, isTurn && styles.cardActive, compact && styles.cardCompact]}>
            <View style={styles.header}>
              <Avatar color={p.color} letter={p.name.slice(0, 1)} size={avatarSize} image={AVATAR_IMAGES[p.id] ?? null} />
              <Text style={styles.name} numberOfLines={1}>{p.name}{p.isAI ? '(AI)' : ''}</Text>
              {hasLongestRoad ? <Text style={styles.badge}>🚩</Text> : null}
              {hasLargestArmy ? <Text style={styles.badge}>⚔</Text> : null}
            </View>
            <View style={styles.metaRow}>
              <Vp size={compact ? 11 : 13} />
              <Text style={styles.scoreText}>{visiblePoints(state, p.id)}</Text>
              <Ionicons name="star" size={compact ? 10 : 12} color={PALETTE.gold} style={{ marginLeft: SPACING.sm }} />
              <Text style={styles.scoreText}>{p.cards.length}</Text>
              <Ionicons name="albums" size={compact ? 11 : 13} color={PALETTE.inkSoft} style={{ marginLeft: SPACING.sm }} />
              <Text style={styles.scoreText}>{handCount}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { gap: SPACING.sm },
  card: {
    backgroundColor: PALETTE.washi, borderRadius: RADIUS.md, padding: SPACING.sm,
    borderLeftWidth: BORDER.thick,
    ...ELEVATION.card,
  },
  cardCompact: { padding: SPACING.xs },
  cardActive: { borderColor: PALETTE.gold, borderWidth: BORDER.thin },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  name: { ...TYPE.label, color: PALETTE.ink, flexShrink: 1 },
  badge: { fontSize: 11 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  scoreText: { ...TYPE.caption, color: PALETTE.ink },
});
