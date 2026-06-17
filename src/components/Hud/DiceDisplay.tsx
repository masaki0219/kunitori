import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  dice: [number, number] | null;
}

export default function DiceDisplay({ dice }: Props) {
  if (!dice) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.die}>{dice[0]}</Text>
      <Text style={styles.die}>{dice[1]}</Text>
      <Text style={styles.sum}>合計 {dice[0] + dice[1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 4 },
  die: { fontSize: 22, fontWeight: 'bold', borderWidth: 1, borderColor: '#333', borderRadius: 6, paddingHorizontal: 10 },
  sum: { fontSize: 14, color: '#444' },
});
