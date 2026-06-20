import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Overlay from './Overlay';
import { VASSAL_DESCRIPTIONS, VASSAL_LABELS, formatCost, RESOURCE_LABELS, TERRAIN_LABELS } from '../../config/labels';
import { BANK_TRADE_RATE, COSTS, HAND_LIMIT_FOR_DISCARD, RAID_MIN, NETWORK_MIN, PIECE_LIMITS, PORT_RATES, PRESTIGE, WIN_PRESTIGE } from '../../config/rules';
import { VassalId } from '../../game/types';
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

const VASSAL_ORDER: VassalId[] = ['fushin', 'gunshi', 'kaisen', 'daikan', 'kura', 'hatamoto'];

export default function RulesModal({ onClose }: Props) {
  return (
    <Overlay onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>ルール早見表</Text>
          <ScrollView style={{ marginTop: 8 }}>
            <Section title="ゲームの流れ">
              <Line>1. サイコロを振る → 出た数字のヘクスから資源が配られる</Line>
              <Line>2. 交易・建設・家臣の登用を行う</Line>
              <Line>3. 「手番終了」で次のプレイヤーへ</Line>
              <Line>威信が{WIN_PRESTIGE}点に達したプレイヤーが勝利</Line>
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
              <Line>家臣: {formatCost(COSTS.card)}</Line>
            </Section>

            <Section title="交易">
              <Line>楽市：同じ資源{BANK_TRADE_RATE}つ→好きな資源1つ</Line>
              <Line>湊：海岸に拠点を置くとその資源が{PORT_RATES.specific}つで交換可</Line>
              <Line>他プレイヤーとの交易も提案できる</Line>
            </Section>

            <Section title="得点の種類">
              <Line>砦: {PRESTIGE.fort}点 / 城: {PRESTIGE.castle}点</Line>
              <Line>街道網：自分の街道で拠点を{NETWORK_MIN}つ以上つなぐと威信+{PRESTIGE.network}</Line>
              <Line>戦功：略奪に{RAID_MIN}回成功すると威信+{PRESTIGE.warMerit}</Line>
            </Section>

            <Section title="家臣">
              {VASSAL_ORDER.map((id) => (
                <Line key={id}>{VASSAL_LABELS[id]}: {VASSAL_DESCRIPTIONS[id]}</Line>
              ))}
            </Section>

            <Section title="一揆">
              <Line>サイコロで7が出ると、手札{HAND_LIMIT_FOR_DISCARD}枚以上のプレイヤーは一揆により年貢を半分供出する</Line>
              <Line>一揆をヘクス間で移動させ、隣接する相手から略奪できる</Line>
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
