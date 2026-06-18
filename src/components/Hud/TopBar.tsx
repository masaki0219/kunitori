import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PALETTE, RADIUS, SPACING, ELEVATION } from '../../config/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  onMenu?: () => void;
  onRules?: () => void;
  onStats?: () => void;
  onSettings?: () => void;
}

export default function TopBar({ style, onMenu, onRules, onStats, onSettings }: Props) {
  return (
    <View style={[styles.bar, style]}>
      <Pressable style={styles.btn} onPress={onMenu}>
        <Ionicons name="menu" size={22} color={PALETTE.washi} />
      </Pressable>
      <View style={styles.right}>
        <Pressable style={styles.btn} onPress={onRules}>
          <Ionicons name="book" size={20} color={PALETTE.washi} />
        </Pressable>
        <Pressable style={styles.btn} onPress={onStats}>
          <Ionicons name="stats-chart" size={20} color={PALETTE.washi} />
        </Pressable>
        <Pressable style={styles.btn} onPress={onSettings}>
          <Ionicons name="settings-sharp" size={20} color={PALETTE.washi} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  right: { flexDirection: 'row', gap: SPACING.sm },
  btn: {
    width: 40, height: 40, borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(62,39,24,0.7)', alignItems: 'center', justifyContent: 'center',
    ...ELEVATION.card,
  },
});
