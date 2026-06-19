import React from 'react';
import { ScrollView, Text, View } from 'react-native';

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
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#200' }} contentContainerStyle={{ padding: 24 }}>
          <Text style={{ color: '#f88', fontWeight: 'bold', fontSize: 16 }}>クラッシュを捕捉しました</Text>
          <Text style={{ color: '#fff', marginTop: 8 }}>{String(this.state.error?.message)}</Text>
          <Text style={{ color: '#fcc', marginTop: 8, fontSize: 11 }}>{this.state.info}</Text>
        </ScrollView>
      );
    }
    return this.props.children as any;
  }
}
