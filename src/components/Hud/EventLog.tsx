import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  log: string[];
  guideText: string;
}

export default function EventLog({ style, log, guideText }: Props) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.title}>イベントログ</Text>
      {(log ?? []).slice(-3).map((line, i) => (
        <Text key={i} style={styles.line}>{line}</Text>
      ))}
      <Text style={styles.guide}>▸ {guideText}</Text>
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
  title: { color: PALETTE.gold, ...TYPE.label },
  line: { color: PALETTE.washiDark, ...TYPE.caption, marginTop: 2 },
  guide: { color: PALETTE.goldLight, ...TYPE.label, marginTop: SPACING.sm },
});
