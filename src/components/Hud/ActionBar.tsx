import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../config/labels';
import { GamePhase } from '../../game/types';

export type BuildMode = 'road' | 'fort' | 'castle' | null;

interface Props {
  phase: GamePhase;
  buildMode: BuildMode;
  onSetBuildMode: (mode: BuildMode) => void;
  onRoll: () => void;
  onOpenTrade: () => void;
  onOpenCard: () => void;
  onEndTurn: () => void;
  disabled?: boolean;
}

export default function ActionBar({ phase, buildMode, onSetBuildMode, onRoll, onOpenTrade, onOpenCard, onEndTurn, disabled }: Props) {
  if (phase === 'roll') {
    return (
      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={onRoll} disabled={disabled}>
          <Text style={styles.primaryText}>サイコロを振る</Text>
        </Pressable>
      </View>
    );
  }

  if (phase !== 'main') {
    return null;
  }

  const toggle = (mode: BuildMode) => onSetBuildMode(buildMode === mode ? null : mode);

  return (
    <View style={styles.row}>
      <Pressable style={[styles.button, buildMode === 'road' && styles.buttonActive]} onPress={() => toggle('road')} disabled={disabled}>
        <Text style={styles.buttonText}>街道</Text>
      </Pressable>
      <Pressable style={[styles.button, buildMode === 'fort' && styles.buttonActive]} onPress={() => toggle('fort')} disabled={disabled}>
        <Text style={styles.buttonText}>砦</Text>
      </Pressable>
      <Pressable style={[styles.button, buildMode === 'castle' && styles.buttonActive]} onPress={() => toggle('castle')} disabled={disabled}>
        <Text style={styles.buttonText}>城</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onOpenTrade} disabled={disabled}>
        <Text style={styles.buttonText}>交易</Text>
      </Pressable>
      <Pressable style={styles.button} onPress={onOpenCard} disabled={disabled}>
        <Text style={styles.buttonText}>カード</Text>
      </Pressable>
      <Pressable style={styles.endButton} onPress={onEndTurn} disabled={disabled}>
        <Text style={styles.endText}>手番終了</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8, justifyContent: 'center' },
  button: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#eee' },
  buttonActive: { backgroundColor: COLORS.brandGreen },
  buttonText: { fontWeight: 'bold', color: '#333' },
  endButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: COLORS.orange },
  endText: { color: '#fff', fontWeight: 'bold' },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8, backgroundColor: COLORS.brandGreen },
  primaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
