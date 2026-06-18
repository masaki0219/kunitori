import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
        {content}
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
