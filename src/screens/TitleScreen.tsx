import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BRANDING } from '../config/branding';
import { COLORS } from '../config/labels';
import { useGameStore } from '../store/gameStore';

export default function TitleScreen() {
  const goToScreen = useGameStore((s) => s.goToScreen);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{BRANDING.appName}</Text>
      <Text style={styles.subtitle}>戦国・領地拡大ゲーム</Text>
      <Pressable style={styles.button} onPress={() => goToScreen('home')}>
        <Text style={styles.buttonText}>対局を始める</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: COLORS.brandGreen },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 24 },
  button: { backgroundColor: COLORS.orange, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
