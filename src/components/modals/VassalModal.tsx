import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Overlay from './Overlay';
import { COSTS } from '../../config/rules';
import { VASSAL_DESCRIPTIONS, VASSAL_LABELS } from '../../config/labels';
import { canAfford } from '../../game/resources';
import { GameState, VassalId } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  state: GameState;
  onRecruit: () => void;
  onClose: () => void;
}

export default function VassalModal({ state, onRecruit, onClose }: Props) {
  const player = state.players.find((p) => p.id === state.currentPlayer)!;
  const canRecruit = state.vassalDeck.length > 0 && canAfford(player.resources, COSTS.card);

  return (
    <Overlay onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>家臣</Text>
          <Pressable style={[styles.buyButton, !canRecruit && styles.disabled]} disabled={!canRecruit} onPress={onRecruit}>
            <Text style={styles.buyText}>登用（米1・鉄1・馬1）{state.vassalDeck.length === 0 ? '（山札なし）' : ''}</Text>
          </Pressable>

          <ScrollView style={{ marginTop: 12 }}>
            {player.vassals.map((id: VassalId, i: number) => (
              <View key={i} style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{VASSAL_LABELS[id]}</Text>
                  <Text style={styles.cardDesc}>{VASSAL_DESCRIPTIONS[id]}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '90%', maxHeight: '80%', ...ELEVATION.floating },
  title: { ...TYPE.h2, color: PALETTE.ink, marginBottom: SPACING.sm },
  buyButton: { backgroundColor: PALETTE.goldLight, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center' },
  buyText: { color: PALETTE.wood900, fontWeight: 'bold' },
  disabled: { backgroundColor: PALETTE.washiDark },
  cardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderColor: PALETTE.washiDark, gap: 8 },
  cardName: { fontWeight: 'bold', color: PALETTE.ink },
  cardDesc: { fontSize: 11, color: PALETTE.inkSoft },
  closeButton: { alignItems: 'center', marginTop: SPACING.sm, padding: SPACING.sm },
});
