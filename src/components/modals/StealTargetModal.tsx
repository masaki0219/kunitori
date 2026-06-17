import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Player, PlayerId } from '../../game/types';

interface Props {
  candidates: Player[];
  onSelect: (playerId: PlayerId) => void;
}

export default function StealTargetModal({ candidates, onSelect }: Props) {
  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>略奪する相手を選んでください</Text>
          {candidates.map((p) => (
            <Pressable key={p.id} style={[styles.row, { borderColor: p.color }]} onPress={() => onSelect(p.id)}>
              <Text style={styles.name}>{p.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '80%', gap: 10 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  row: { borderWidth: 2, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  name: { fontWeight: 'bold' },
});
