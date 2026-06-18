import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BRANDING } from '../config/branding';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../config/theme';
import { useGameStore } from '../store/gameStore';

export default function TitleScreen() {
  const goToScreen = useGameStore((s) => s.goToScreen);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[PALETTE.wood500, PALETTE.wood900]} style={StyleSheet.absoluteFill} />
      <Text style={styles.title}>{BRANDING.appName}</Text>
      <Text style={styles.subtitle}>戦国・領地拡大ゲーム</Text>
      <Pressable style={styles.button} onPress={() => goToScreen('home')}>
        <Text style={styles.buttonText}>対局を始める</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  title: { ...TYPE.display, color: PALETTE.gold },
  subtitle: { ...TYPE.body, color: PALETTE.washiDark, marginBottom: SPACING.xl },
  button: {
    backgroundColor: PALETTE.goldLight, borderColor: PALETTE.goldDark, borderWidth: 1,
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.md,
    ...ELEVATION.floating,
  },
  buttonText: { ...TYPE.h1, color: PALETTE.wood900 },
});
