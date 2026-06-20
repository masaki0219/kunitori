import React, { useEffect } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

interface Props {
  children: React.ReactNode;
  onRequestClose?: () => void; // Android 戻るボタン対応（任意）
}

// RN 0.85 + Fabric の <Modal> はネイティブクラッシュするため使用しない。
// 全画面の絶対配置オーバーレイで代替する共通コンポーネント。
export default function Overlay({ children, onRequestClose }: Props) {
  useEffect(() => {
    if (!onRequestClose) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onRequestClose();
      return true;
    });
    return () => sub.remove();
  }, [onRequestClose]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      {children}
    </View>
  );
}
