import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { RESOURCE_LABELS } from '../../config/labels';
import { ResourceType } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  mode: 'harvest' | 'requisition';
  onConfirmHarvest: (picks: ResourceType[]) => void;
  onConfirmRequisition: (resource: ResourceType) => void;
  onCancel: () => void;
}

const ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export default function DevCardEffectModal({ mode, onConfirmHarvest, onConfirmRequisition, onCancel }: Props) {
  const [picks, setPicks] = useState<ResourceType[]>([]);

  if (mode === 'requisition') {
    return (
      <Modal transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>徴発：奪う資源を1種選んでください</Text>
            <View style={styles.chipRow}>
              {ORDER.map((r) => (
                <Pressable key={r} style={styles.chip} onPress={() => onConfirmRequisition(r)}>
                  <Text>{RESOURCE_LABELS[r]}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.closeButton} onPress={onCancel}><Text>キャンセル</Text></Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const toggle = (r: ResourceType) => {
    setPicks((prev) => {
      if (prev.length >= 2 && !prev.includes(r)) return prev;
      return [...prev, r].slice(0, 2);
    });
  };

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>豊作：好きな資源を合計2個選んでください</Text>
          <Text style={styles.sub}>選択中: {picks.map((p) => RESOURCE_LABELS[p]).join(', ') || 'なし'}</Text>
          <View style={styles.chipRow}>
            {ORDER.map((r) => (
              <Pressable key={r} style={styles.chip} onPress={() => toggle(r)}>
                <Text>{RESOURCE_LABELS[r]}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={[styles.confirmButton, picks.length !== 2 && styles.disabled]}
            disabled={picks.length !== 2}
            onPress={() => onConfirmHarvest(picks)}
          >
            <Text style={styles.confirmText}>確定</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={onCancel}><Text>キャンセル</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.xl, width: '85%', gap: 8, ...ELEVATION.floating },
  title: { ...TYPE.h2, color: PALETTE.ink },
  sub: { fontSize: 12, color: PALETTE.inkSoft },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.sm, backgroundColor: PALETTE.washiDark },
  confirmButton: { backgroundColor: PALETTE.goldLight, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  disabled: { backgroundColor: PALETTE.washiDark },
  confirmText: { color: PALETTE.wood900, fontWeight: 'bold' },
  closeButton: { alignItems: 'center', marginTop: 4, padding: 6 },
});
