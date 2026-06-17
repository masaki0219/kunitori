import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameState } from '../../game/types';
import { computePoints } from '../../game/scoring';
import { countResources } from '../../game/resources';

interface Props {
  state: GameState;
}

export default function PlayerPanel({ state }: Props) {
  return (
    <ScrollView horizontal contentContainerStyle={styles.row} showsHorizontalScrollIndicator={false}>
      {state.players.map((p) => {
        const isCurrent = p.id === state.currentPlayer;
        const forts = state.buildings.filter((b) => b.owner === p.id && b.type === 'fort').length;
        const castles = state.buildings.filter((b) => b.owner === p.id && b.type === 'castle').length;
        const points = p.id === state.currentPlayer ? computePoints(state, p.id) : undefined;

        return (
          <View key={p.id} style={[styles.card, { borderColor: p.color }, isCurrent && styles.current]}>
            <Text style={[styles.name, { color: p.color }]}>{p.name}{p.isAI ? '(AI)' : ''}</Text>
            <Text style={styles.detail}>砦{forts} 城{castles}</Text>
            <Text style={styles.detail}>手札{countResources(p.resources)} カード{p.cards.length}</Text>
            <Text style={styles.detail}>{points !== undefined ? `点数 ${points}` : ''}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, padding: 8 },
  card: { borderWidth: 1, borderRadius: 8, padding: 8, minWidth: 110, backgroundColor: '#fff' },
  current: { borderWidth: 3 },
  name: { fontWeight: 'bold', fontSize: 13 },
  detail: { fontSize: 11, color: '#444' },
});
