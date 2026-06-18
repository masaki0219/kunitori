import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COSTS } from '../../config/rules';
import { CARD_DESCRIPTIONS, CARD_LABELS } from '../../config/labels';
import { canPlayCard } from '../../game/cards';
import { canAfford } from '../../game/resources';
import { CardType, GameState } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  state: GameState;
  onBuy: () => void;
  onPlay: (index: number) => void;
  onClose: () => void;
}

export default function CardModal({ state, onBuy, onPlay, onClose }: Props) {
  const player = state.players.find((p) => p.id === state.currentPlayer)!;
  const canBuy = state.deck.length > 0 && canAfford(player.resources, COSTS.card);

  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>軍略カード</Text>
          <Pressable style={[styles.buyButton, !canBuy && styles.disabled]} disabled={!canBuy} onPress={onBuy}>
            <Text style={styles.buyText}>購入（米1・鉄1・馬1）{state.deck.length === 0 ? '（山札なし）' : ''}</Text>
          </Pressable>

          <ScrollView style={{ marginTop: 12 }}>
            {player.cards.map((c: CardType, i: number) => {
              const playable = canPlayCard(state, i);
              return (
                <View key={i} style={styles.cardRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{CARD_LABELS[c]}</Text>
                    <Text style={styles.cardDesc}>{CARD_DESCRIPTIONS[c]}</Text>
                  </View>
                  {c !== 'merit' ? (
                    <Pressable style={[styles.useButton, !playable && styles.disabled]} disabled={!playable} onPress={() => onPlay(i)}>
                      <Text style={styles.useText}>使う</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  useButton: { backgroundColor: PALETTE.vermilion, borderRadius: RADIUS.sm, paddingVertical: 8, paddingHorizontal: 12 },
  useText: { color: '#fff', fontWeight: 'bold' },
  closeButton: { alignItems: 'center', marginTop: SPACING.sm, padding: SPACING.sm },
});
