import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, formatCost } from '../../config/labels';
import { COSTS, PIECE_LIMITS } from '../../config/rules';
import { canAfford } from '../../game/resources';
import { GamePhase, Player } from '../../game/types';

export type BuildMode = 'road' | 'fort' | 'castle' | null;

interface Props {
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
}

export default function ActionBar({
  phase,
  buildMode,
  player,
  onSetBuildMode,
  onRoll,
  onOpenTrade,
  onOpenCard,
  onOpenRules,
  onEndTurn,
  disabled,
}: Props) {
  const rulesButton = (
    <Pressable style={styles.rulesButton} onPress={onOpenRules}>
      <Text style={styles.rulesText}>？ ルール</Text>
    </Pressable>
  );

  if (phase === 'roll') {
    return (
      <View style={styles.row}>
        <Pressable style={styles.primaryButton} onPress={onRoll} disabled={disabled}>
          <Text style={styles.primaryText}>サイコロを振る</Text>
        </Pressable>
        {rulesButton}
      </View>
    );
  }

  if (phase !== 'main') {
    return <View style={styles.row}>{rulesButton}</View>;
  }

  const toggle = (mode: BuildMode) => onSetBuildMode(buildMode === mode ? null : mode);

  const canBuildRoad = player.piecesLeft.road > 0 && canAfford(player.resources, COSTS.road);
  const canBuildFort = player.piecesLeft.fort > 0 && canAfford(player.resources, COSTS.fort);
  const canBuildCastle = player.piecesLeft.castle > 0 && canAfford(player.resources, COSTS.castle);
  const canBuyCard = canAfford(player.resources, COSTS.card);

  return (
    <View style={styles.row}>
      <BuildButton
        label="街道"
        cost={formatCost(COSTS.road)}
        active={buildMode === 'road'}
        affordable={canBuildRoad}
        left={player.piecesLeft.road}
        limit={PIECE_LIMITS.road}
        disabled={disabled}
        onPress={() => toggle('road')}
      />
      <BuildButton
        label="砦"
        cost={formatCost(COSTS.fort)}
        active={buildMode === 'fort'}
        affordable={canBuildFort}
        left={player.piecesLeft.fort}
        limit={PIECE_LIMITS.fort}
        disabled={disabled}
        onPress={() => toggle('fort')}
      />
      <BuildButton
        label="城"
        cost={formatCost(COSTS.castle)}
        active={buildMode === 'castle'}
        affordable={canBuildCastle}
        left={player.piecesLeft.castle}
        limit={PIECE_LIMITS.castle}
        disabled={disabled}
        onPress={() => toggle('castle')}
      />
      <Pressable style={styles.button} onPress={onOpenTrade} disabled={disabled}>
        <Text style={styles.buttonText}>交易</Text>
      </Pressable>
      <BuildButton
        label="カード"
        cost={formatCost(COSTS.card)}
        active={false}
        affordable={canBuyCard}
        disabled={disabled}
        onPress={onOpenCard}
      />
      {rulesButton}
      <Pressable style={styles.endButton} onPress={onEndTurn} disabled={disabled}>
        <Text style={styles.endText}>手番終了</Text>
      </Pressable>
    </View>
  );
}

interface BuildButtonProps {
  label: string;
  cost: string;
  active: boolean;
  affordable: boolean;
  left?: number;
  limit?: number;
  disabled?: boolean;
  onPress: () => void;
}

function BuildButton({ label, cost, active, affordable, left, limit, disabled, onPress }: BuildButtonProps) {
  const outOfStock = left !== undefined && left <= 0;
  return (
    <Pressable
      style={[styles.button, active && styles.buttonActive, !affordable && styles.buttonInsufficient]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.buttonText}>{label}</Text>
      <Text style={[styles.costText, !affordable && styles.costTextInsufficient]}>{cost}</Text>
      {left !== undefined ? (
        <Text style={[styles.stockText, outOfStock && styles.costTextInsufficient]}>残り{left}/{limit}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8, justifyContent: 'center', alignItems: 'center' },
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center', minWidth: 64 },
  buttonActive: { backgroundColor: COLORS.brandGreen },
  buttonInsufficient: { borderWidth: 1, borderColor: '#C0392B' },
  buttonText: { fontWeight: 'bold', color: '#333' },
  costText: { fontSize: 10, color: '#555', marginTop: 2 },
  costTextInsufficient: { color: '#C0392B', fontWeight: 'bold' },
  stockText: { fontSize: 9, color: '#888' },
  endButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: COLORS.orange },
  endText: { color: '#fff', fontWeight: 'bold' },
  primaryButton: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 8, backgroundColor: COLORS.brandGreen },
  primaryText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  rulesButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: '#5B6066' },
  rulesText: { color: '#fff', fontWeight: 'bold' },
});
