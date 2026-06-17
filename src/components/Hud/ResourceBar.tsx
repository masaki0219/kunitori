import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RESOURCE_LABELS } from '../../config/labels';
import { Resources } from '../../game/types';

interface Props {
  resources: Resources;
}

const ORDER: (keyof Resources)[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export default function ResourceBar({ resources }: Props) {
  return (
    <View style={styles.row}>
      {ORDER.map((r) => (
        <View key={r} style={styles.item}>
          <Text style={styles.label}>{RESOURCE_LABELS[r]}</Text>
          <Text style={styles.value}>{resources[r]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, backgroundColor: '#fff' },
  item: { alignItems: 'center' },
  label: { fontSize: 11, color: '#666' },
  value: { fontSize: 16, fontWeight: 'bold' },
});
