import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRANDING } from '../config/branding';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../config/theme';
import { TITLE_BG_IMAGE } from '../config/assets';
import { useGameStore } from '../store/gameStore';

export default function TitleScreen() {
  const goToScreen = useGameStore((s) => s.goToScreen);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <View style={[styles.container, {
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    }]}>
      <Image source={TITLE_BG_IMAGE} style={{ position: 'absolute', width, height }} resizeMode="cover" />

      <LinearGradient
        colors={['rgba(36,23,16,0.10)', 'rgba(36,23,16,0.55)', 'rgba(36,23,16,0.30)']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.title}>{BRANDING.appName}</Text>
      <Text style={styles.subtitle}>戦国・領地拡大ゲーム</Text>
      <Pressable style={styles.button} onPress={() => goToScreen('home')}>
        <Text style={styles.buttonText}>対局を始める</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md,
    backgroundColor: PALETTE.wood900,
  },
  title: {
    ...TYPE.display, color: PALETTE.gold,
    textShadowColor: 'rgba(36,23,16,0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    ...TYPE.body, color: PALETTE.washiDark, marginBottom: SPACING.xl,
    textShadowColor: 'rgba(36,23,16,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  button: {
    backgroundColor: PALETTE.goldLight, borderColor: PALETTE.goldDark, borderWidth: 1,
    paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, borderRadius: RADIUS.md,
    ...ELEVATION.floating,
  },
  buttonText: { ...TYPE.h1, color: PALETTE.wood900 },
});
