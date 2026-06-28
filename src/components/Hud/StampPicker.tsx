import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Overlay from '../modals/Overlay';
import { STAMPS } from '../../config/stamps';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  onPick: (stampId: string) => void;
  onClose: () => void;
}

export default function StampPicker({ onPick, onClose }: Props) {
  return (
    <Overlay onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>スタンプ</Text>
          <View style={styles.grid}>
            {STAMPS.map((s) => (
              <Pressable
                key={s.id}
                style={styles.cell}
                onPress={() => { onPick(s.id); onClose(); }}
              >
                <Text style={styles.emoji}>{s.emoji}</Text>
                <Text style={styles.label} numberOfLines={1}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '90%', maxWidth: 480, ...ELEVATION.floating },
  title: { ...TYPE.h2, color: PALETTE.ink, marginBottom: SPACING.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, justifyContent: 'center' },
  cell: {
    width: 96, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: PALETTE.washiDark, alignItems: 'center', gap: 2,
  },
  emoji: { fontSize: 28 },
  label: { ...TYPE.caption, color: PALETTE.ink },
  closeButton: { alignItems: 'center', marginTop: SPACING.md, padding: SPACING.sm, backgroundColor: PALETTE.goldLight, borderRadius: RADIUS.md },
  closeText: { color: PALETTE.wood900, fontWeight: 'bold' },
});
