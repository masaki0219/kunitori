import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useNetStore } from '../../net/netStore';
import { useGameStore } from '../../store/gameStore';
import { STAMP_BY_ID } from '../../config/stamps';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  style?: StyleProp<ViewStyle>;
}

const HOLD_MS = 2200;

export default function StampDisplay({ style }: Props) {
  const lastStamp = useNetStore((s) => s.lastStamp);
  const players = useGameStore((s) => s.players);
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<typeof lastStamp>(null);

  useEffect(() => {
    if (!lastStamp) return;
    setShown(lastStamp);
    opacity.stopAnimation();
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(HOLD_MS),
      Animated.timing(opacity, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) setShown(null); });
    // msgId をキーに再発火させる
  }, [lastStamp?.msgId]);

  if (!shown) return null;
  const def = STAMP_BY_ID[shown.stampId];
  if (!def) return null;
  const sender = players.find((p) => p.id === shown.seat);
  const color = sender?.color ?? PALETTE.gold;

  return (
    <Animated.View style={[styles.wrap, style, { opacity }]} pointerEvents="none">
      <View style={[styles.bubble, { borderColor: color }]}>
        <Text style={styles.emoji}>{def.emoji}</Text>
        <View style={styles.textCol}>
          <Text style={[styles.sender, { color }]} numberOfLines={1}>{sender?.name ?? '相手'}</Text>
          <Text style={styles.label} numberOfLines={1}>{def.label}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignSelf: 'center', alignItems: 'center', zIndex: 20 },
  bubble: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(36,23,16,0.92)', borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
    borderWidth: 2, ...ELEVATION.floating,
  },
  emoji: { fontSize: 34 },
  textCol: { gap: 1 },
  sender: { ...TYPE.label },
  label: { ...TYPE.body, color: PALETTE.washi, fontWeight: 'bold' },
});
