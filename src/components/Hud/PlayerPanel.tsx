import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { GameState, ResourceType } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION, BORDER } from '../../config/theme';
import ResourceIcon from '../icons/ResourceIcon';
import Vp from '../icons/Vp';

interface Props {
  state: GameState;
  style?: StyleProp<ViewStyle>;
}

const ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

// 表示専用：対戦相手には公開情報だけから計算した点を見せる（軍功などの隠し点は含めない）
function visiblePoints(state: GameState, id: number): number {
  const forts = state.buildings.filter((b) => b.owner === id && b.type === 'fort').length;
  const castles = state.buildings.filter((b) => b.owner === id && b.type === 'castle').length;
  const lr = state.longestRoadHolder === id ? 2 : 0;
  const la = state.largestArmyHolder === id ? 2 : 0;
  return forts * 1 + castles * 2 + lr + la;
}

export default function PlayerPanel({ state, style }: Props) {
  const opponents = state.players.filter((p) => p.id !== state.currentPlayer);

  return (
    <View style={[styles.rail, style]}>
      {opponents.map((p) => {
        const isTurn = p.id === state.currentPlayer;
        return (
          <View key={p.id} style={[styles.card, isTurn && styles.cardActive]}>
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: p.color }]}>
                <Text style={styles.avatarText}>{p.name.slice(0, 1)}</Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>{p.name}{p.isAI ? '(AI)' : ''}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Vp size={13} />
              <Text style={styles.scoreText}>{visiblePoints(state, p.id)}</Text>
              <Ionicons name="star" size={12} color={PALETTE.gold} style={{ marginLeft: SPACING.sm }} />
              <Text style={styles.scoreText}>{p.cards.length}</Text>
            </View>
            <View style={styles.resGrid}>
              {ORDER.map((r) => (
                <View key={r} style={styles.resItem}>
                  <ResourceIcon resource={r} size={16} />
                  <Text style={styles.resCount}>{p.resources[r]}</Text>
                </View>
              ))}
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
    ...ELEVATION.card,
  },
  cardActive: { borderColor: PALETTE.gold, borderWidth: BORDER.thick },
  header: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  avatar: { width: 28, height: 28, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  name: { ...TYPE.label, color: PALETTE.ink, flexShrink: 1 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  scoreText: { ...TYPE.caption, color: PALETTE.ink },
  resGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  resItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  resCount: { ...TYPE.caption, color: PALETTE.inkSoft },
});
