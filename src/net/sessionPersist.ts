import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'kunitori:hostSession';
export interface HostSession { roomCode: string; hostName: string; }

export async function saveHostSession(s: HostSession): Promise<void> {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
export async function loadHostSession(): Promise<HostSession | null> {
  try { const v = await AsyncStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
export async function clearHostSession(): Promise<void> {
  try { await AsyncStorage.removeItem(KEY); } catch {}
}
