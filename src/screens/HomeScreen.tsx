import React from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../config/labels';
import { useGameStore } from '../store/gameStore';
import { useNetStore } from '../net/netStore';
import { useProfileStore } from '../store/profileStore';

export default function HomeScreen() {
  const goToScreen = useGameStore((s) => s.goToScreen);
  const { startLocal, hostCreateRoom } = useNetStore();
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, {
          paddingLeft: insets.left + 24,
          paddingRight: insets.right + 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>あそびかたを選ぶ</Text>

        <Text style={styles.label}>あなたの名前</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="大名"
          placeholderTextColor="#bbb"
          selectTextOnFocus
          returnKeyType="done"
        />

        <Pressable style={styles.primary} onPress={() => { startLocal(); goToScreen('setup'); }}>
          <Text style={styles.primaryText}>1台で遊ぶ（ローカル対戦）</Text>
        </Pressable>

        <Pressable style={styles.primary}
          onPress={async () => { await hostCreateRoom(name.trim() || '大名'); goToScreen('lobby'); }}>
          <Text style={styles.primaryText}>オンラインで部屋を作る</Text>
        </Pressable>

        <Pressable style={styles.secondary} onPress={() => goToScreen('joinRoom')}>
          <Text style={styles.secondaryText}>部屋に参加する</Text>
        </Pressable>

        <Pressable onPress={() => goToScreen('title')}><Text style={styles.back}>← もどる</Text></Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.cream },
  content: { flexGrow: 1, gap: 14, justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: 'bold', color: COLORS.brandGreen },
  label: { fontSize: 13, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, backgroundColor: '#fff' },
  primary: { backgroundColor: COLORS.orange, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondary: { borderWidth: 1, borderColor: COLORS.brandGreen, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  secondaryText: { color: COLORS.brandGreen, fontSize: 16, fontWeight: 'bold' },
  back: { color: '#888', marginTop: 8 },
});
