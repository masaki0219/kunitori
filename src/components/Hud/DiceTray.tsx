import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { GamePhase } from '../../game/types';
import { DiePips } from '../icons/Pips';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
  phase: GamePhase;
  dice: [number, number] | null;
  onRoll: () => void;
  onEndTurn: () => void;
  disabled?: boolean;
}

function Die({ value }: { value: number | null }) {
  return (
    <View style={styles.die}>
      <Svg width={34} height={34} viewBox="0 0 34 34">
        <Rect x={1} y={1} width={32} height={32} rx={8} fill={PALETTE.washi} stroke={PALETTE.wood700} strokeWidth={1} />
        {value !== null ? <DiePips value={value} size={34} color={PALETTE.ink} /> : null}
      </Svg>
    </View>
  );
}

export default function DiceTray({ style, phase, dice, onRoll, onEndTurn, disabled }: Props) {
  if (phase === 'roll') {
    return (
      <View style={[styles.tray, style]}>
        <Pressable style={styles.rollBtn} onPress={onRoll} disabled={disabled}>
          <Text style={styles.rollText}>サイコロを振る</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={[styles.tray, style]}>
      <Die value={dice?.[0] ?? null} />
      <Die value={dice?.[1] ?? null} />
      <Pressable
        style={[styles.endBtn, (phase !== 'main' || disabled) && styles.endDisabled]}
        disabled={phase !== 'main' || disabled}
        onPress={onEndTurn}
      >
        <Text style={styles.endText}>手番終了</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  die: { ...ELEVATION.card },
  rollBtn: {
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md, backgroundColor: PALETTE.goldLight,
    borderWidth: 1, borderColor: PALETTE.goldDark,
    ...ELEVATION.floating,
  },
  rollText: { ...TYPE.h2, color: PALETTE.wood900 },
  endBtn: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md, backgroundColor: PALETTE.vermilion,
  },
  endDisabled: { opacity: 0.4 },
  endText: { ...TYPE.label, color: PALETTE.washi },
});
