import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNetStore } from '../../net/netStore';
import { STAMP_BY_ID } from '../../config/stamps';
import { PlayerId } from '../../game/types';
import { PALETTE, RADIUS, SPACING, TYPE, ELEVATION } from '../../config/theme';

interface Props {
  seat: PlayerId;
  color: string;
  compact?: boolean;
  /** バブルを表示する向き。left=自分の左（右側レール用）, top=自分の上（手札パネル用） */
  anchor?: 'left' | 'top';
}

const HOLD_MS = 2200;

// 各プレイヤーの表示位置のすぐ隣にスタンプを出す（盤面中央に出すと連続送信で盤面が見えなくなるため）。
export default function StampBubble({ seat, color, compact, anchor = 'left' }: Props) {
  const lastStamp = useNetStore((s) => s.lastStamp);
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<typeof lastStamp>(null);

  useEffect(() => {
    if (!lastStamp || lastStamp.seat !== seat) return;
    setShown(lastStamp);
    opacity.stopAnimation();
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(HOLD_MS),
      Animated.timing(opacity, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) setShown(null); });
  }, [lastStamp?.msgId, seat]);

  if (!shown) return null;
  const def = STAMP_BY_ID[shown.stampId];
  if (!def) return null;

  return (
    <Animated.View
      style={[styles.wrap, anchor === 'left' ? styles.wrapLeft : styles.wrapTop, { opacity }]}
      pointerEvents="none"
    >
      <View style={[styles.bubble, { borderColor: color }]}>
        <Text style={compact ? styles.emojiCompact : styles.emoji}>{def.emoji}</Text>
        <Text style={styles.label} numberOfLines={1}>{def.label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', zIndex: 20 },
  wrapLeft: { right: '100%', top: '50%', marginTop: -16, marginRight: SPACING.xs },
  wrapTop: { bottom: '100%', left: 0, marginBottom: SPACING.xs },
  bubble: {
    flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 150,
    backgroundColor: 'rgba(36,23,16,0.92)', borderRadius: RADIUS.pill,
    paddingVertical: 4, paddingHorizontal: SPACING.sm,
    borderWidth: 2, ...ELEVATION.floating,
  },
  emoji: { fontSize: 22 },
  emojiCompact: { fontSize: 18 },
  label: { ...TYPE.caption, color: PALETTE.washi, fontWeight: 'bold', flexShrink: 1 },
});
