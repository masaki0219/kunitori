import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { useGameStore } from '../store/gameStore';

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null; info: string }
> {
  state = { error: null as Error | null, info: '' };
  static getDerivedStateFromError(error: Error) { return { error, info: '' }; }
  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
    this.setState({ info: info?.componentStack ?? '' });
  }
  handleReset = () => {
    useGameStore.getState().goToScreen('home');
    this.setState({ error: null, info: '' });
  };
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#200' }} contentContainerStyle={{ padding: 24 }}>
          <Text style={{ color: '#f88', fontWeight: 'bold', fontSize: 16 }}>クラッシュを捕捉しました</Text>
          <Text style={{ color: '#fff', marginTop: 8 }}>{String(this.state.error?.message)}</Text>
          <Text style={{ color: '#fcc', marginTop: 8, fontSize: 11 }}>{this.state.info}</Text>
          <Pressable
            onPress={this.handleReset}
            style={{ marginTop: 20, backgroundColor: '#f88', borderRadius: 8, padding: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#200', fontWeight: 'bold' }}>ホームに戻る</Text>
          </Pressable>
        </ScrollView>
      );
    }
    return this.props.children as any;
  }
}
