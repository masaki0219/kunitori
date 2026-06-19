import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  onMenu?: () => void;
  onSettings?: () => void;
  onRules?: () => void;
  onStats?: () => void;
  onChat?: () => void;
}

export default function TopBar({ style, onMenu, onSettings, onRules, onStats, onChat }: Props) {
  return (
    <View style={[styles.bar, style]}>
      <View style={styles.group}>
        <Pressable style={styles.iconBtn} onPress={onMenu}>
          <Ionicons name="menu" size={22} color={PALETTE.washi} />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={onSettings}>
          <Ionicons name="settings-sharp" size={20} color={PALETTE.washi} />
        </Pressable>
      </View>
      <View style={styles.group}>
        <LabeledButton icon="book" label="ルール" onPress={onRules} />
        <LabeledButton icon="stats-chart" label="統計" onPress={onStats} />
        <LabeledButton icon="chatbubble-ellipses" label="チャット" onPress={onChat} disabled={!onChat} />
      </View>
    </View>
  );
}

function LabeledButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable style={[styles.labeledBtn, disabled && styles.labeledBtnDisabled]} onPress={onPress} disabled={disabled}>
      <Ionicons name={icon} size={18} color={PALETTE.washi} />
      <Text style={styles.labeledBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  group: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(62,39,24,0.7)', alignItems: 'center', justifyContent: 'center',
    ...ELEVATION.card,
  },
  labeledBtn: {
    paddingVertical: 6, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(62,39,24,0.7)', alignItems: 'center', minWidth: 56,
    ...ELEVATION.card,
  },
  labeledBtnDisabled: { opacity: 0.4 },
  labeledBtnText: { ...TYPE.caption, color: PALETTE.washi, marginTop: 2 },
});
