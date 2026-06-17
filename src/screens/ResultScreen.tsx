import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config/labels';
import { computePoints } from '../game/scoring';
import { useGameStore } from '../store/gameStore';

export default function ResultScreen() {
  const players = useGameStore((s) => s.players);
  const winner = useGameStore((s) => s.winner);
  const state = useGameStore((s) => s);
  const resetGame = useGameStore((s) => s.resetGame);

  const ranking = [...players]
    .map((p) => ({
      player: p,
      points: computePoints(state, p.id),
      forts: state.buildings.filter((b) => b.owner === p.id && b.type === 'fort').length,
      castles: state.buildings.filter((b) => b.owner === p.id && b.type === 'castle').length,
      merits: p.cards.filter((c) => c === 'merit').length,
      longestRoad: state.longestRoadHolder === p.id,
      largestArmy: state.largestArmyHolder === p.id,
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>
        {winner !== null ? `${players.find((p) => p.id === winner)?.name} の勝利！` : '結果'}
      </Text>

      {ranking.map((r, i) => (
        <View key={r.player.id} style={[styles.card, { borderColor: r.player.color }]}>
          <Text style={styles.rank}>{i + 1}位　{r.player.name}（{r.points}点）</Text>
          <Text style={styles.detail}>砦 {r.forts} ／ 城 {r.castles}</Text>
          <Text style={styles.detail}>最長街道 {r.longestRoad ? '○' : '−'} ／ 最大兵力 {r.largestArmy ? '○' : '−'}</Text>
          <Text style={styles.detail}>軍功 {r.merits}</Text>
        </View>
      ))}

      <Pressable style={styles.button} onPress={resetGame}>
        <Text style={styles.buttonText}>もう一度遊ぶ</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.cream, padding: 24, gap: 12 },
  heading: { fontSize: 24, fontWeight: 'bold', color: COLORS.brandGreen, marginBottom: 12, textAlign: 'center' },
  card: { borderWidth: 2, borderRadius: 8, padding: 12, backgroundColor: '#fff', gap: 4 },
  rank: { fontSize: 16, fontWeight: 'bold' },
  detail: { fontSize: 13, color: '#444' },
  button: { backgroundColor: COLORS.orange, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
