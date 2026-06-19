import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatCost } from '../../config/labels';
import { COSTS, PIECE_LIMITS } from '../../config/rules';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';
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
  const canBuildCastle = player.piecesLeft.castle > 0 && canAfford(player.resources, COSTS.castle);
  const canBuyCard = canAfford(player.resources, COSTS.card);

  return (
    <View style={[styles.dock, compact && styles.dockCompact, style]}>
      <BuildButton
        icon="road-variant"
        label="街道"
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
        cost={formatCost(COSTS.castle)}
        active={buildMode === 'castle'}
        affordable={canBuildCastle}
        left={player.piecesLeft.castle}
        limit={PIECE_LIMITS.castle}
        disabled={disabled}
        compact={compact}
        onPress={() => toggle('castle')}
      />
      <Pressable style={[styles.btn, compact && styles.btnCompact]} onPress={onOpenTrade} disabled={disabled}>
        <MaterialCommunityIcons name="swap-horizontal" size={compact ? 16 : 20} color={PALETTE.washi} />
        <Text style={styles.btnLabel}>交易</Text>
      </Pressable>
      <BuildButton
        icon="cards"
        label="カード"
        cost={formatCost(COSTS.card)}
        active={false}
        affordable={canBuyCard}
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
  cost: string;
  active: boolean;
  affordable: boolean;
  left?: number;
  limit?: number;
  disabled?: boolean;
  compact?: boolean;
  onPress: () => void;
}

function BuildButton({ icon, label, cost, active, affordable, left, limit, disabled, compact, onPress }: BuildButtonProps) {
  const outOfStock = left !== undefined && left <= 0;
  return (
    <Pressable
      style={[styles.btn, compact && styles.btnCompact, active && styles.btnActive, !affordable && styles.btnInsufficient]}
      onPress={onPress}
      disabled={disabled}
    >
      <MaterialCommunityIcons name={icon} size={compact ? 16 : 20} color={active ? PALETTE.wood900 : PALETTE.washi} />
      <Text style={[styles.btnLabel, active && styles.btnLabelActive]}>{label}</Text>
      <Text style={[styles.costText, !affordable && styles.costTextInsufficient]}>{cost}</Text>
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
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', minWidth: 62,
  },
  btnCompact: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.xs, minWidth: 46 },
  btnActive: { backgroundColor: PALETTE.gold },
  btnInsufficient: { borderWidth: 1, borderColor: PALETTE.vermilionLight },
  btnLabel: { ...TYPE.label, color: PALETTE.washi, marginTop: 2 },
  btnLabelActive: { color: PALETTE.wood900 },
  costText: { ...TYPE.caption, color: PALETTE.washiDark, marginTop: 2 },
  costTextInsufficient: { color: PALETTE.vermilionLight, fontWeight: '700' },
  stockText: { ...TYPE.caption, color: PALETTE.washiDark, fontSize: 9 },
});
