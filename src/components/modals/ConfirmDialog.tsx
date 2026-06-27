import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Overlay from './Overlay';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'はい',
  cancelLabel = 'キャンセル',
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Overlay onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, destructive ? styles.destructiveBtn : styles.confirmBtn]}
              onPress={onConfirm}
            >
              <Text style={destructive ? styles.destructiveText : styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '82%', maxWidth: 420, ...ELEVATION.floating },
  title: { ...TYPE.h2, color: PALETTE.ink },
  message: { fontSize: 14, color: PALETTE.inkSoft, marginTop: SPACING.sm, lineHeight: 20 },
  row: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  btn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: PALETTE.washiDark },
  cancelText: { ...TYPE.label, color: PALETTE.ink },
  confirmBtn: { backgroundColor: PALETTE.goldLight, borderWidth: 1, borderColor: PALETTE.goldDark },
  confirmText: { ...TYPE.label, color: PALETTE.wood900 },
  destructiveBtn: { backgroundColor: PALETTE.vermilion },
  destructiveText: { ...TYPE.label, color: PALETTE.washi },
});
