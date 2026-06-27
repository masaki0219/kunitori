import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Overlay from './Overlay';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  onClose: () => void;
  onQuitToHome: () => void;
}

export default function SettingsModal({ onClose, onQuitToHome }: Props) {
  const version = '';
  return (
    <Overlay onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>設定</Text>

          <Pressable style={styles.itemDanger} onPress={onQuitToHome}>
            <Text style={styles.itemDangerText}>対局を破棄してホームに戻る</Text>
          </Pressable>

          {version ? <Text style={styles.version}>バージョン {version}</Text> : null}

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
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '86%', maxWidth: 440, ...ELEVATION.floating },
  title: { ...TYPE.h1, color: PALETTE.ink, marginBottom: SPACING.md },
  itemDanger: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm, backgroundColor: 'rgba(194,84,26,0.12)', borderWidth: 1, borderColor: PALETTE.vermilion },
  itemDangerText: { ...TYPE.label, color: PALETTE.vermilion },
  version: { ...TYPE.caption, color: PALETTE.inkSoft, marginTop: SPACING.sm, textAlign: 'center' },
  closeButton: { alignItems: 'center', marginTop: SPACING.md, padding: SPACING.sm, backgroundColor: PALETTE.goldLight, borderRadius: RADIUS.md },
  closeText: { color: PALETTE.wood900, fontWeight: 'bold' },
});
