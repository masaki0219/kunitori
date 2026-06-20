import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Overlay from './Overlay';
import { CARD_DESCRIPTIONS, CARD_LABELS, formatCost, RESOURCE_LABELS, TERRAIN_LABELS } from '../../config/labels';
import { BANK_TRADE_RATE, COSTS, GENERIC_PORT_COUNT, HAND_LIMIT_FOR_DISCARD, LARGEST_ARMY_MIN, NETWORK_MIN, PIECE_LIMITS, PORT_RATES, PRESTIGE, SPECIFIC_PORT_RESOURCES, WIN_PRESTIGE } from '../../config/rules';
import { CardType } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  onClose: () => void;
}

const TERRAIN_TO_RESOURCE: Record<string, string> = {
  forest: RESOURCE_LABELS.timber,
  quarry: RESOURCE_LABELS.stone,
  paddy: RESOURCE_LABELS.rice,
  pasture: RESOURCE_LABELS.horse,
  mine: RESOURCE_LABELS.iron,
  wasteland: 'なし',
};

const CARD_ORDER: CardType[] = ['warlord', 'merit', 'construction', 'harvest', 'requisition'];

export default function RulesModal({ onClose }: Props) {
  return (
    <Overlay onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>ルール早見表</Text>
          <ScrollView style={{ marginTop: 8 }}>
            <Section title="ゲームの流れ">
              <Line>1. サイコロを振る → 出た数字のヘクスから資源が配られる</Line>
              <Line>2. 交易・建設・カードの使用を行う</Line>
              <Line>3. 「手番終了」で次のプレイヤーへ</Line>
              <Line>勝利点が{WIN_PRESTIGE}点に達したプレイヤーが勝利</Line>
            </Section>

            <Section title="資源と地形">
              {Object.entries(TERRAIN_TO_RESOURCE).map(([t, r]) => (
                <Line key={t}>{TERRAIN_LABELS[t as keyof typeof TERRAIN_LABELS]} → {r}</Line>
              ))}
            </Section>

            <Section title="建設に必要なもの">
              <Line>街道: {formatCost(COSTS.road)}（残り{PIECE_LIMITS.road}本まで）</Line>
              <Line>砦: {formatCost(COSTS.fort)}（残り{PIECE_LIMITS.fort}個まで・{PRESTIGE.fort}点）</Line>
              <Line>城（砦の昇格）: {formatCost(COSTS.castle)}（残り{PIECE_LIMITS.castle}個まで・{PRESTIGE.castle}点）</Line>
              <Line>軍略カード: {formatCost(COSTS.card)}</Line>
            </Section>

            <Section title="交易">
              <Line>銀行交易: 同じ資源{BANK_TRADE_RATE}個 → 好きな資源1個</Line>
              <Line>港: 海岸に砦/城を置くとレートが優遇される（{PORT_RATES.specific}:1の資源指定港{SPECIFIC_PORT_RESOURCES.length}個・{PORT_RATES.generic}:1の汎用港{GENERIC_PORT_COUNT}個）</Line>
              <Line>港を持たない資源は{BANK_TRADE_RATE}:1のまま</Line>
              <Line>他プレイヤーとの交易も提案できる</Line>
            </Section>

            <Section title="得点の種類">
              <Line>砦: {PRESTIGE.fort}点 / 城: {PRESTIGE.castle}点</Line>
              <Line>街道網：自分の街道で拠点を{NETWORK_MIN}つ以上つなぐと威信+{PRESTIGE.network}</Line>
              <Line>最大兵力（武将{LARGEST_ARMY_MIN}枚以上で獲得）: {PRESTIGE.largestArmy}点</Line>
              <Line>軍功カード: {PRESTIGE.merit}点</Line>
            </Section>

            <Section title="軍略カード">
              {CARD_ORDER.map((c) => (
                <Line key={c}>{CARD_LABELS[c]}: {CARD_DESCRIPTIONS[c]}</Line>
              ))}
            </Section>

            <Section title="野盗">
              <Line>サイコロで7が出ると、手札{HAND_LIMIT_FOR_DISCARD}枚以上のプレイヤーは半分捨てる</Line>
              <Line>野盗を移動させ、そのヘクスに隣接する相手から1枚奪える</Line>
            </Section>
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>閉じる</Text>
          </Pressable>
        </View>
      </View>
    </Overlay>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return <Text style={styles.line}>{children}</Text>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(36,23,16,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: PALETTE.washi, borderRadius: RADIUS.lg, padding: SPACING.lg, width: '92%', maxHeight: '85%', ...ELEVATION.floating },
  title: { ...TYPE.h1, color: PALETTE.ink },
  section: { marginBottom: 14 },
  sectionTitle: { ...TYPE.label, color: PALETTE.gold, marginBottom: 4 },
  line: { fontSize: 13, color: PALETTE.inkSoft, marginBottom: 3, lineHeight: 18 },
  closeButton: { alignItems: 'center', marginTop: SPACING.sm, padding: SPACING.sm, backgroundColor: PALETTE.goldLight, borderRadius: RADIUS.md },
  closeText: { color: PALETTE.wood900, fontWeight: 'bold' },
});
