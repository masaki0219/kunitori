import React, { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { RESOURCE_LABELS } from '../../config/labels';
import { countResources } from '../../game/resources';
import { Player, ResourceType } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  player: Player;
  onConfirm: (give: Partial<Record<ResourceType, number>>) => void;
}

const ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export default function DiscardModal({ player, onConfirm }: Props) {
  const required = Math.floor(countResources(player.resources) / 2);
  const [picked, setPicked] = useState<Partial<Record<ResourceType, number>>>({});

  const total = useMemo(() => Object.values(picked).reduce((s, v) => s + (v ?? 0), 0), [picked]);

  const inc = (r: ResourceType) => {
    if (total >= required) return;
    if ((picked[r] ?? 0) >= player.resources[r]) return;
    setPicked((prev) => ({ ...prev, [r]: (prev[r] ?? 0) + 1 }));
  };
  const dec = (r: ResourceType) => {
    if ((picked[r] ?? 0) <= 0) return;
    setPicked((prev) => ({ ...prev, [r]: (prev[r] ?? 0) - 1 }));
  };

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{player.name} は {required} 枚捨ててください</Text>
          <Text style={styles.sub}>（手札 {countResources(player.resources)} 枚の半分）</Text>
          {ORDER.map((r) => (
            <View key={r} style={styles.row}>
              <Text style={styles.label}>{RESOURCE_LABELS[r]}（所持{player.resources[r]}）</Text>
              <Pressable style={styles.smallButton} onPress={() => dec(r)}><Text>-</Text></Pressable>
              <Text style={styles.count}>{picked[r] ?? 0}</Text>
              <Pressable style={styles.smallButton} onPress={() => inc(r)}><Text>+</Text></Pressable>
            </View>
          ))}
          <Pressable
            style={[styles.confirmButton, total !== required && styles.confirmDisabled]}
            disabled={total !== required}
            onPress={() => onConfirm(picked)}
          >
            <Text style={styles.confirmText}>確定（{total}/{required}）</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.xl, width: '85%', gap: 8, ...ELEVATION.floating },
  title: { ...TYPE.h2, color: PALETTE.ink },
  sub: { fontSize: 12, color: PALETTE.inkSoft, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  label: { flex: 1, fontSize: 13, color: PALETTE.ink },
  smallButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.washiDark, alignItems: 'center', justifyContent: 'center' },
  count: { width: 24, textAlign: 'center', fontWeight: 'bold', color: PALETTE.ink },
  confirmButton: { backgroundColor: PALETTE.goldLight, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  confirmDisabled: { backgroundColor: PALETTE.washiDark },
  confirmText: { color: PALETTE.wood900, fontWeight: 'bold' },
});
