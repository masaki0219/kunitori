import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BANK_TRADE_RATE } from '../../config/rules';
import { RESOURCE_LABELS } from '../../config/labels';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';
import { Player, PlayerId, ResourceType } from '../../game/types';

interface Props {
  currentPlayer: Player;
  otherPlayers: Player[];
  onBankTrade: (give: ResourceType, take: ResourceType) => void;
  onProposeTrade: (toPlayer: PlayerId, give: Partial<Record<ResourceType, number>>, want: Partial<Record<ResourceType, number>>) => void;
  onClose: () => void;
}

const ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export default function TradeModal({ currentPlayer, otherPlayers, onBankTrade, onProposeTrade, onClose }: Props) {
  const [tab, setTab] = useState<'bank' | 'propose'>('bank');
  const [give, setGive] = useState<ResourceType | null>(null);
  const [take, setTake] = useState<ResourceType | null>(null);

  const [toPlayer, setToPlayer] = useState<PlayerId | null>(otherPlayers[0]?.id ?? null);
  const [giveAmt, setGiveAmt] = useState<Partial<Record<ResourceType, number>>>({});
  const [wantAmt, setWantAmt] = useState<Partial<Record<ResourceType, number>>>({});

  if (!currentPlayer || !currentPlayer.resources) {
    return null;
  }

  const bumpGive = (r: ResourceType) => setGiveAmt((p) => ({ ...p, [r]: Math.min((p[r] ?? 0) + 1, currentPlayer.resources?.[r] ?? 0) }));
  const dropGive = (r: ResourceType) => setGiveAmt((p) => ({ ...p, [r]: Math.max((p[r] ?? 0) - 1, 0) }));
  const bumpWant = (r: ResourceType) => setWantAmt((p) => ({ ...p, [r]: (p[r] ?? 0) + 1 }));
  const dropWant = (r: ResourceType) => setWantAmt((p) => ({ ...p, [r]: Math.max((p[r] ?? 0) - 1, 0) }));

  // Modal は使わない（RN 0.85 + Fabric/New Architecture の <Modal> がネイティブクラッシュの主因と判明したため、
  // GameScreen の respondOverlay と同様の絶対配置 View オーバーレイに統一）
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.tabs}>
            <Pressable style={[styles.tab, tab === 'bank' && styles.tabActive]} onPress={() => setTab('bank')}>
              <Text>銀行</Text>
            </Pressable>
            <Pressable style={[styles.tab, tab === 'propose' && styles.tabActive]} onPress={() => setTab('propose')}>
              <Text>提案</Text>
            </Pressable>
          </View>

          {tab === 'bank' ? (
            <ScrollView>
              <Text style={styles.label}>出す資源（{BANK_TRADE_RATE}個必要）</Text>
              <View style={styles.chipRow}>
                {ORDER.map((r) => (
                  <Pressable
                    key={r}
                    style={[styles.chip, give === r && styles.chipActive, (currentPlayer.resources?.[r] ?? 0) < BANK_TRADE_RATE && styles.chipDisabled]}
                    disabled={(currentPlayer.resources?.[r] ?? 0) < BANK_TRADE_RATE}
                    onPress={() => setGive(r)}
                  >
                    <Text>{RESOURCE_LABELS[r]}({currentPlayer.resources?.[r] ?? 0})</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>もらう資源</Text>
              <View style={styles.chipRow}>
                {ORDER.map((r) => (
                  <Pressable key={r} style={[styles.chip, take === r && styles.chipActive]} onPress={() => setTake(r)}>
                    <Text>{RESOURCE_LABELS[r]}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={[styles.confirmButton, (!give || !take || give === take) && styles.confirmDisabled]}
                disabled={!give || !take || give === take}
                onPress={() => { if (give && take) { onBankTrade(give, take); onClose(); } }}
              >
                <Text style={styles.confirmText}>交換</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView>
              <Text style={styles.label}>相手</Text>
              <View style={styles.chipRow}>
                {otherPlayers.map((p) => (
                  <Pressable key={p.id} style={[styles.chip, toPlayer === p.id && styles.chipActive]} onPress={() => setToPlayer(p.id)}>
                    <Text>{p.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>自分が出す</Text>
              {ORDER.map((r) => (
                <View key={r} style={styles.row}>
                  <Text style={styles.rowLabel}>{RESOURCE_LABELS[r]}</Text>
                  <Pressable style={styles.smallButton} onPress={() => dropGive(r)}><Text>-</Text></Pressable>
                  <Text style={styles.count}>{giveAmt[r] ?? 0}</Text>
                  <Pressable style={styles.smallButton} onPress={() => bumpGive(r)}><Text>+</Text></Pressable>
                </View>
              ))}
              <Text style={styles.label}>欲しい</Text>
              {ORDER.map((r) => (
                <View key={r} style={styles.row}>
                  <Text style={styles.rowLabel}>{RESOURCE_LABELS[r]}</Text>
                  <Pressable style={styles.smallButton} onPress={() => dropWant(r)}><Text>-</Text></Pressable>
                  <Text style={styles.count}>{wantAmt[r] ?? 0}</Text>
                  <Pressable style={styles.smallButton} onPress={() => bumpWant(r)}><Text>+</Text></Pressable>
                </View>
              ))}
              <Pressable
                style={styles.confirmButton}
                onPress={() => { if (toPlayer !== null) { onProposeTrade(toPlayer, giveAmt, wantAmt); onClose(); } }}
              >
                <Text style={styles.confirmText}>提案</Text>
              </Pressable>
            </ScrollView>
          )}

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '90%', maxHeight: '80%', ...ELEVATION.floating },
  tabs: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  tab: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderRadius: RADIUS.md, backgroundColor: PALETTE.washiDark },
  tabActive: { backgroundColor: PALETTE.gold },
  label: { ...TYPE.label, color: PALETTE.ink, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: RADIUS.sm, backgroundColor: PALETTE.washiDark },
  chipActive: { backgroundColor: PALETTE.gold },
  chipDisabled: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 2 },
  rowLabel: { flex: 1, color: PALETTE.ink },
  smallButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: PALETTE.washiDark, alignItems: 'center', justifyContent: 'center' },
  count: { width: 24, textAlign: 'center', fontWeight: 'bold', color: PALETTE.ink },
  confirmButton: { backgroundColor: PALETTE.goldLight, borderRadius: RADIUS.md, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  confirmDisabled: { backgroundColor: PALETTE.washiDark },
  confirmText: { color: PALETTE.wood900, fontWeight: 'bold' },
  closeButton: { alignItems: 'center', marginTop: SPACING.sm, padding: SPACING.sm },
});
