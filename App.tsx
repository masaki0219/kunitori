import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from './src/components/ErrorBoundary';
import GameScreen from './src/screens/GameScreen';
import HomeScreen from './src/screens/HomeScreen';
import JoinRoomScreen from './src/screens/JoinRoomScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import ResultScreen from './src/screens/ResultScreen';
import SetupScreen from './src/screens/SetupScreen';
import TitleScreen from './src/screens/TitleScreen';
import { useGameStore } from './src/store/gameStore';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  // DIAGNOSTIC: 交易ボタンクラッシュ調査用の一時ハンドラ（修正指示書v2 §1 A-1）
  useEffect(() => {
    const g: any = globalThis;
    const prev = g.ErrorUtils?.getGlobalHandler?.();
    g.ErrorUtils?.setGlobalHandler?.((error: any, isFatal?: boolean) => {
      console.error('[GLOBAL JS ERROR]', isFatal, error?.message, error?.stack);
      prev?.(error, isFatal);
    });
  }, []);

  // 画面を横向きに固定（修正指示書 §2 Step3）
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {
      // ロック失敗は致命的でないため握りつぶす（Web等では no-op）
    });
  }, []);

  let content;
  switch (screen) {
    case 'title':
      content = <TitleScreen />;
      break;
    case 'home':
      content = <HomeScreen />;
      break;
    case 'joinRoom':
      content = <JoinRoomScreen />;
      break;
    case 'lobby':
      content = <LobbyScreen />;
      break;
    case 'setup':
      content = <SetupScreen />;
      break;
    case 'game':
      content = <GameScreen />;
      break;
    case 'result':
      content = <ResultScreen />;
      break;
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <ErrorBoundary>{content}</ErrorBoundary>
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
