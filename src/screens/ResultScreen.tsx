import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION, BORDER } from '../config/theme';
import { computePrestige, hasStrongholdNetwork } from '../game/scoring';
import { useGameStore } from '../store/gameStore';

export default function ResultScreen() {
  const players = useGameStore((s) => s.players);
  const winner = useGameStore((s) => s.winner);
  const state = useGameStore((s) => s);
  const resetGame = useGameStore((s) => s.resetGame);

  const ranking = [...players]
    .map((p) => ({
      player: p,
      points: computePrestige(state, p.id),
      forts: state.buildings.filter((b) => b.owner === p.id && b.type === 'fort').length,
      castles: state.buildings.filter((b) => b.owner === p.id && b.type === 'castle').length,
      vassalCount: p.vassals.length,
      network: hasStrongholdNetwork(state, p.id),
      largestArmy: state.largestArmyHolder === p.id,
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[PALETTE.wood500, PALETTE.wood900]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>
          {winner !== null ? `${players.find((p) => p.id === winner)?.name} の勝利！` : '結果'}
        </Text>

        {ranking.map((r, i) => (
          <View key={r.player.id} style={[styles.card, { borderColor: r.player.color }, i === 0 && styles.cardWinner]}>
            <Text style={styles.rank}>{i + 1}位　{r.player.name}（{r.points}点）</Text>
            <Text style={styles.detail}>砦 {r.forts} ／ 城 {r.castles}</Text>
            <Text style={styles.detail}>街道網 {r.network ? '○' : '−'} ／ 最大兵力 {r.largestArmy ? '○' : '−'}</Text>
            <Text style={styles.detail}>家臣 {r.vassalCount}</Text>
          </View>
        ))}

        <Pressable style={styles.button} onPress={resetGame}>
          <Text style={styles.buttonText}>もう一度遊ぶ</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flexGrow: 1, padding: SPACING.xl, gap: SPACING.sm },
  heading: { ...TYPE.h1, color: PALETTE.gold, marginBottom: SPACING.md, textAlign: 'center' },
  card: { borderWidth: BORDER.thick, borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: PALETTE.washi, gap: 4, ...ELEVATION.card },
  cardWinner: { borderColor: PALETTE.gold },
  rank: { ...TYPE.h2, color: PALETTE.ink },
  detail: { ...TYPE.body, color: PALETTE.inkSoft },
  button: { backgroundColor: PALETTE.goldLight, borderColor: PALETTE.goldDark, borderWidth: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.lg, ...ELEVATION.floating },
  buttonText: { ...TYPE.h2, color: PALETTE.wood900 },
});
