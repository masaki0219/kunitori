import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCost } from '../../config/labels';
import { COSTS, PIECE_LIMITS } from '../../config/rules';
import { ACTION_COLORS, PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';
import { applyDaimyoCost } from '../../game/daimyo';
import { canAfford } from '../../game/resources';
import { GamePhase, Player } from '../../game/types';

export type BuildMode = 'road' | 'fort' | 'castle' | null;

interface Props {
  style?: StyleProp<ViewStyle>;
  phase: GamePhase;
  buildMode: BuildMode;
  player: Player;
  onSetBuildMode: (mode: BuildMode) => void;
  onRoll: () => void;
  onOpenTrade: () => void;
  onOpenCard: () => void;
  onOpenRules: () => void;
  onEndTurn: () => void;
  disabled?: boolean;
  compact?: boolean;
}

// サイコロ/ルール/手番終了は TopBar・DiceTray が担当する。
// onRoll/onOpenRules/onEndTurn は受け取るのみで、ここでは描画しない（props 据え置きのため）。
export default function ActionBar({
  style,
  phase,
  buildMode,
  player,
  onSetBuildMode,
  onOpenTrade,
  onOpenCard,
  disabled,
  compact,
}: Props) {
  if (phase !== 'main') return null;

  const toggle = (mode: BuildMode) => onSetBuildMode(buildMode === mode ? null : mode);

  const canBuildRoad = player.piecesLeft.road > 0 && canAfford(player.resources, COSTS.road);
  const canBuildFort = player.piecesLeft.fort > 0 && canAfford(player.resources, COSTS.fort);
  const castleCost = applyDaimyoCost(player, 'castle', COSTS.castle);
  const canBuildCastle = player.piecesLeft.castle > 0 && canAfford(player.resources, castleCost);
  const canBuyCard = canAfford(player.resources, COSTS.card);

  return (
    <View style={[styles.dock, compact && styles.dockCompact, style]}>
      <BuildButton
        icon="road-variant"
        label="街道"
        color={ACTION_COLORS.road}
        cost={formatCost(COSTS.road)}
        active={buildMode === 'road'}
        affordable={canBuildRoad}
        left={player.piecesLeft.road}
        limit={PIECE_LIMITS.road}
        disabled={disabled}
        compact={compact}
        onPress={() => toggle('road')}
      />
      <BuildButton
        icon="home"
        label="砦"
        color={ACTION_COLORS.fort}
        cost={formatCost(COSTS.fort)}
        active={buildMode === 'fort'}
        affordable={canBuildFort}
        left={player.piecesLeft.fort}
        limit={PIECE_LIMITS.fort}
        disabled={disabled}
        compact={compact}
        onPress={() => toggle('fort')}
      />
      <BuildButton
        icon="castle"
        label="城"
        color={ACTION_COLORS.castle}
        cost={formatCost(castleCost)}
        active={buildMode === 'castle'}
        affordable={canBuildCastle}
        left={player.piecesLeft.castle}
        limit={PIECE_LIMITS.castle}
        disabled={disabled}
        compact={compact}
        onPress={() => toggle('castle')}
      />
      <Pressable
        style={[styles.btn, compact && styles.btnCompact, { backgroundColor: ACTION_COLORS.trade }]}
        onPress={onOpenTrade}
        disabled={disabled}
      >
        <View style={styles.btnTop}>
          <MaterialCommunityIcons name="swap-horizontal" size={compact ? 14 : 18} color={PALETTE.washi} />
          <Text style={styles.btnLabel}>交易</Text>
        </View>
      </Pressable>
      <BuildButton
        icon="cards"
        label="登用"
        color={ACTION_COLORS.card}
        cost={formatCost(COSTS.card)}
        active={false}
        affordable={canBuyCard}
        badge={player.vassals.length}
        disabled={disabled}
        compact={compact}
        onPress={onOpenCard}
      />
    </View>
  );
}

interface BuildButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  cost: string;
  active: boolean;
  affordable: boolean;
  left?: number;
  limit?: number;
  badge?: number;
  disabled?: boolean;
  compact?: boolean;
  onPress: () => void;
}

function BuildButton({ icon, label, color, cost, active, affordable, left, limit, badge, disabled, compact, onPress }: BuildButtonProps) {
  const outOfStock = left !== undefined && left <= 0;
  const tokens = cost ? cost.split('・') : [];
  return (
    <Pressable
      style={[
        styles.btn,
        compact && styles.btnCompact,
        { backgroundColor: color },
        active && styles.btnActive,
        !affordable && styles.btnInsufficient,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {badge !== undefined && badge > 0 ? (
        <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>
      ) : null}

      <View style={styles.btnTop}>
        <MaterialCommunityIcons name={icon} size={compact ? 14 : 18} color={active ? PALETTE.wood900 : PALETTE.washi} />
        <Text style={[styles.btnLabel, active && styles.btnLabelActive]} numberOfLines={1}>{label}</Text>
      </View>

      {tokens.length > 0 ? (
        <View style={styles.costWrap}>
          {tokens.map((t, i) => (
            <Text key={i} style={[styles.costToken, !affordable && styles.costTextInsufficient]}>{t}</Text>
          ))}
        </View>
      ) : null}

      {left !== undefined && !compact ? (
        <Text style={[styles.stockText, outOfStock && styles.costTextInsufficient]}>残り{left}/{limit}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row', gap: SPACING.sm,
    backgroundColor: 'rgba(30,26,22,0.92)',
    borderRadius: RADIUS.lg, padding: SPACING.sm,
    ...ELEVATION.floating,
  },
  dockCompact: { gap: SPACING.xs, padding: SPACING.xs },
  btn: {
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md,
    alignItems: 'center', width: 84,
  },
  badge: {
    position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: PALETTE.vermilion, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, zIndex: 1,
  },
  badgeText: { color: PALETTE.washi, fontSize: 10, fontWeight: '700' },
  btnCompact: { width: 66, paddingVertical: 2, paddingHorizontal: SPACING.xs },
  btnActive: { backgroundColor: PALETTE.gold },
  btnInsufficient: { borderWidth: 1, borderColor: PALETTE.vermilionLight },
  btnTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnLabel: { ...TYPE.label, color: PALETTE.washi },
  btnLabelActive: { color: PALETTE.wood900 },
  costWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 3, marginTop: 2 },
  costToken: { ...TYPE.caption, color: PALETTE.washiDark },
  costTextInsufficient: { color: PALETTE.vermilionLight, fontWeight: '700' },
  stockText: { ...TYPE.caption, color: PALETTE.washiDark, fontSize: 9, marginTop: 1 },
});
