import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { COLORS } from '../config/labels';
import { useGameStore } from '../store/gameStore';

interface PlayerConfig {
  name: string;
  isAI: boolean;
}

function defaultPlayers(count: number): PlayerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `大名${i + 1}`,
    isAI: i > 0,
  }));
}

export default function SetupScreen() {
  const startGame = useGameStore((s) => s.startGame);
  const [count, setCount] = useState(3);
  const [players, setPlayers] = useState<PlayerConfig[]>(defaultPlayers(3));

  const setCountAndResize = (n: number) => {
    setCount(n);
    setPlayers((prev) => {
      const next = defaultPlayers(n);
      for (let i = 0; i < Math.min(n, prev.length); i++) next[i] = prev[i];
      return next;
    });
  };

  const updatePlayer = (i: number, patch: Partial<PlayerConfig>) => {
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const hasHuman = players.some((p) => !p.isAI);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>プレイヤー設定</Text>

      <View style={styles.countRow}>
        {[2, 3, 4].map((n) => (
          <Pressable
            key={n}
            style={[styles.countButton, count === n && styles.countButtonActive]}
            onPress={() => setCountAndResize(n)}
          >
            <Text style={count === n ? styles.countTextActive : styles.countText}>{n}人</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.note}>2人だとバランスが偏りやすい（3人以上推奨）</Text>

      {players.map((p, i) => (
        <View key={i} style={styles.playerRow}>
          <TextInput
            style={styles.input}
            value={p.name}
            onChangeText={(t) => updatePlayer(i, { name: t })}
          />
          <Text style={styles.switchLabel}>{p.isAI ? 'AI' : '人間'}</Text>
          <Switch value={p.isAI} onValueChange={(v) => updatePlayer(i, { isAI: v })} />
        </View>
      ))}

      {!hasHuman ? <Text style={styles.warning}>最低1人は人間が必要です</Text> : null}

      <Pressable
        style={[styles.startButton, !hasHuman && styles.startButtonDisabled]}
        disabled={!hasHuman}
        onPress={() => startGame({ players })}
      >
        <Text style={styles.startButtonText}>開始</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.cream, padding: 24, gap: 16 },
  heading: { fontSize: 24, fontWeight: 'bold', color: COLORS.brandGreen, marginBottom: 8 },
  countRow: { flexDirection: 'row', gap: 8 },
  countButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: COLORS.brandGreen },
  countButtonActive: { backgroundColor: COLORS.brandGreen },
  countText: { color: COLORS.brandGreen },
  countTextActive: { color: '#fff' },
  note: { fontSize: 12, color: '#888' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#fff' },
  switchLabel: { width: 36, textAlign: 'center' },
  warning: { color: '#C0392B', fontSize: 13 },
  startButton: { backgroundColor: COLORS.orange, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  startButtonDisabled: { backgroundColor: '#ccc' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
