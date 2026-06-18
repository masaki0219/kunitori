import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  log: string[];
  guideText: string;
  compact?: boolean;
}

export default function EventLog({ style, log, guideText, compact }: Props) {
  return (
    <View style={[styles.card, compact && styles.cardCompact, style]}>
      {!compact ? <Text style={styles.title}>イベントログ</Text> : null}
      {(log ?? []).slice(compact ? -1 : -3).map((line, i) => (
        <Text key={i} style={styles.line} numberOfLines={1}>{line}</Text>
      ))}
      <Text style={styles.guide} numberOfLines={2}>▸ {guideText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(36,23,16,0.78)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    ...ELEVATION.card,
  },
  cardCompact: { padding: SPACING.xs },
  title: { color: PALETTE.gold, ...TYPE.label },
  line: { color: PALETTE.washiDark, ...TYPE.caption, marginTop: 2 },
  guide: { color: PALETTE.goldLight, ...TYPE.label, marginTop: SPACING.sm },
});
