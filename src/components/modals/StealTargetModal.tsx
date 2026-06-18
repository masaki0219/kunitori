import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Player, PlayerId } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION, BORDER } from '../../config/theme';

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
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.xl, width: '80%', gap: 10, ...ELEVATION.floating },
  title: { ...TYPE.h2, color: PALETTE.ink, marginBottom: SPACING.sm },
  row: { borderWidth: BORDER.thick, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, alignItems: 'center' },
  name: { fontWeight: 'bold', color: PALETTE.ink },
});
