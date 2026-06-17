import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import GameScreen from './src/screens/GameScreen';
import ResultScreen from './src/screens/ResultScreen';
import SetupScreen from './src/screens/SetupScreen';
import TitleScreen from './src/screens/TitleScreen';
import { useGameStore } from './src/store/gameStore';

export default function App() {
  const screen = useGameStore((s) => s.screen);

  let content;
  switch (screen) {
    case 'title':
      content = <TitleScreen />;
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
    <SafeAreaView style={styles.container}>
      {content}
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
