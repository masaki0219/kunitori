import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../config/labels';
import { useGameStore } from '../store/gameStore';
import { useNetStore } from '../net/netStore';

export default function JoinRoomScreen() {
  const goToScreen = useGameStore((s) => s.goToScreen);
  const guestJoinRoom = useNetStore((s) => s.guestJoinRoom);
  const [code, setCode] = useState('');
  const [name, setName] = useState('大名');
  const [busy, setBusy] = useState(false);

  const onJoin = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    await guestJoinRoom(code, name.trim() || '大名');
    goToScreen('lobby');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>部屋に参加</Text>
      <Text style={styles.label}>部屋コード</Text>
      <TextInput style={[styles.input, styles.code]} autoCapitalize="characters"
        value={code} onChangeText={setCode} placeholder="例: AB7K2M" />
      <Text style={styles.label}>あなたの名前</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Pressable style={[styles.primary, busy && { opacity: 0.5 }]} disabled={busy} onPress={onJoin}>
        <Text style={styles.primaryText}>{busy ? '接続中…' : '参加する'}</Text>
      </Pressable>
      <Pressable onPress={() => goToScreen('home')}><Text style={styles.back}>← もどる</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.cream, padding: 24, gap: 14, justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', color: COLORS.brandGreen },
  label: { fontSize: 13, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, backgroundColor: '#fff' },
  code: { fontSize: 22, letterSpacing: 4, textAlign: 'center' },
  primary: { backgroundColor: COLORS.orange, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  back: { color: '#888', marginTop: 8 },
});
