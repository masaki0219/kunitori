import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Player } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  log: string[];
  guideText: string;
  isMyTurn?: boolean;
  turnName?: string;
  compact?: boolean;
  players?: Player[];
}

export default function EventLog({ style, log, guideText, isMyTurn, turnName, compact, players }: Props) {
  const colorOf = (line: string) =>
    players?.find((p) => line.startsWith(p.name))?.color ?? PALETTE.washiDark;
  const lines = (log ?? []).slice(compact ? -2 : -4);

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.statusCard, compact && styles.cardCompact]}>
        <View style={styles.statusHeader}>
          <View style={[styles.dot, isMyTurn && styles.dotActive]} />
          <Text style={styles.statusTitle} numberOfLines={1}>
            {isMyTurn ? 'あなたの手番です' : `${turnName ?? '相手'} の手番です`}
          </Text>
        </View>
        <Text style={styles.statusSub} numberOfLines={2}>{guideText}</Text>
      </View>

      <View style={[styles.logCard, compact && styles.logCardCompact]}>
        {!compact ? <Text style={styles.title}>ゲームログ</Text> : null}
        {lines.length > 0 ? (
          lines.map((line, i) => (
            <Text key={i} style={[styles.line, { color: colorOf(line) }]} numberOfLines={1}>{line}</Text>
          ))
        ) : (
          <Text style={styles.linePlaceholder}>（まだありません）</Text>
        )}
        {(log ?? []).length > (compact ? 2 : 4) ? (
          <Ionicons name="chevron-down" size={14} color={PALETTE.washiDark} style={styles.chevron} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.sm },
  statusCard: {
    backgroundColor: 'rgba(36,23,16,0.85)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...ELEVATION.card,
  },
  cardCompact: { padding: SPACING.xs },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.inkSoft },
  dotActive: { backgroundColor: PALETTE.brandGreen },
  statusTitle: { color: PALETTE.washi, ...TYPE.label, flexShrink: 1 },
  statusSub: { color: PALETTE.washiDark, ...TYPE.caption, marginTop: SPACING.xs },
  logCard: {
    backgroundColor: 'rgba(36,23,16,0.78)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...ELEVATION.card,
  },
  logCardCompact: { padding: SPACING.xs },
  title: { color: PALETTE.gold, ...TYPE.label },
  line: { color: PALETTE.washiDark, ...TYPE.caption, marginTop: 2 },
  linePlaceholder: { color: PALETTE.washiDark, ...TYPE.caption, marginTop: 2, opacity: 0.6 },
  chevron: { alignSelf: 'center', marginTop: SPACING.xs },
});
