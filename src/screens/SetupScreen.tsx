import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../config/theme';
import { useGameStore } from '../store/gameStore';
import { useNetStore } from '../net/netStore';

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
    <View style={styles.root}>
      <LinearGradient colors={[PALETTE.wood500, PALETTE.wood900]} style={StyleSheet.absoluteFill} />
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
            <Switch value={p.isAI} onValueChange={(v) => updatePlayer(i, { isAI: v })} trackColor={{ true: PALETTE.gold }} />
          </View>
        ))}

        {!hasHuman ? <Text style={styles.warning}>最低1人は人間が必要です</Text> : null}

        <Pressable
          style={[styles.startButton, !hasHuman && styles.startButtonDisabled]}
          disabled={!hasHuman}
          onPress={() => { useNetStore.getState().startLocal(); startGame({ players }); }}
        >
          <Text style={styles.startButtonText}>開始</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flexGrow: 1, padding: SPACING.xl, gap: SPACING.md },
  heading: { ...TYPE.h1, color: PALETTE.gold, marginBottom: SPACING.sm },
  countRow: { flexDirection: 'row', gap: SPACING.sm },
  countButton: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: PALETTE.gold },
  countButtonActive: { backgroundColor: PALETTE.gold },
  countText: { color: PALETTE.gold, ...TYPE.label },
  countTextActive: { color: PALETTE.wood900, ...TYPE.label },
  note: { ...TYPE.caption, color: PALETTE.washiDark },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: PALETTE.washi, borderRadius: RADIUS.md, padding: SPACING.sm, ...ELEVATION.card },
  input: { flex: 1, borderWidth: 1, borderColor: PALETTE.washiDark, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, backgroundColor: '#fff', color: PALETTE.ink },
  switchLabel: { width: 36, textAlign: 'center', color: PALETTE.ink },
  warning: { color: PALETTE.vermilionLight, fontSize: 13 },
  startButton: { backgroundColor: PALETTE.goldLight, borderColor: PALETTE.goldDark, borderWidth: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.lg, ...ELEVATION.floating },
  startButtonDisabled: { backgroundColor: PALETTE.washiDark, borderColor: PALETTE.washiDark, opacity: 0.6 },
  startButtonText: { ...TYPE.h2, color: PALETTE.wood900 },
});
