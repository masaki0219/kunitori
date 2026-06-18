import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../config/labels';
import { useGameStore } from '../store/gameStore';
import { useNetStore } from '../net/netStore';

export default function LobbyScreen() {
  const goToScreen = useGameStore((s) => s.goToScreen);
  const { role, roomCode, status, members, mySeat, addAISeat, startOnlineGame, leaveRoom } = useNetStore();
  const isHost = role === 'host';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>ロビー</Text>

      <View style={styles.codeBox}>
        <Text style={styles.codeLabel}>部屋コード</Text>
        <Text style={styles.code}>{roomCode}</Text>
        <Text style={styles.hint}>このコードを友達に伝えてください</Text>
      </View>

      <Text style={styles.status}>接続: {statusLabel(status)}</Text>

      <Text style={styles.subhead}>参加者</Text>
      {members.slice().sort((a, b) => a.seat - b.seat).map((m) => (
        <View key={m.seat} style={styles.row}>
          <Text style={styles.seat}>席{m.seat + 1}</Text>
          <Text style={styles.name}>{m.name}{m.isAI ? '（AI）' : ''}{m.seat === mySeat ? '（あなた）' : ''}</Text>
          <Text style={[styles.dot, { color: m.online ? COLORS.brandGreen : '#bbb' }]}>●</Text>
        </View>
      ))}

      {isHost ? (
        <>
          {members.length < 4 ? (
            <Pressable style={styles.secondary} onPress={() => addAISeat(`AI${members.length}`)}>
              <Text style={styles.secondaryText}>＋ AIを追加</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.primary, members.length < 2 && { opacity: 0.5 }]}
            disabled={members.length < 2}
            onPress={() => startOnlineGame()}>
            <Text style={styles.primaryText}>対局を開始</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.waiting}>ホストの開始を待っています…</Text>
      )}

      <Pressable onPress={() => { leaveRoom(); goToScreen('home'); }}>
        <Text style={styles.back}>← 部屋を出る</Text>
      </Pressable>
    </ScrollView>
  );
}

function statusLabel(s: string) {
  return s === 'connected' ? '接続済み' : s === 'connecting' ? '接続中…'
    : s === 'disconnected' ? '切断' : s === 'error' ? 'エラー' : '待機';
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.cream, padding: 24, gap: 12 },
  heading: { fontSize: 24, fontWeight: 'bold', color: COLORS.brandGreen },
  codeBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', gap: 4 },
  codeLabel: { fontSize: 12, color: '#888' },
  code: { fontSize: 32, fontWeight: 'bold', letterSpacing: 6, color: COLORS.orange },
  hint: { fontSize: 12, color: '#888' },
  status: { fontSize: 12, color: '#555' },
  subhead: { fontSize: 14, fontWeight: 'bold', color: '#333', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 8, padding: 10 },
  seat: { width: 44, color: '#888' },
  name: { flex: 1, fontSize: 15 },
  dot: { fontSize: 14 },
  primary: { backgroundColor: COLORS.orange, paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondary: { borderWidth: 1, borderColor: COLORS.brandGreen, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  secondaryText: { color: COLORS.brandGreen, fontWeight: 'bold' },
  waiting: { color: '#555', textAlign: 'center', marginTop: 8 },
  back: { color: '#888', marginTop: 12, textAlign: 'center' },
});
