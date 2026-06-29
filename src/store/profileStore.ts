import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 端末に保存するプレイヤー表示名。マルチプレイの共有状態ではなく端末ローカルの設定なので
// Firebase ではなく AsyncStorage に置く。未設定時は '' とし、画面側は placeholder '大名' を出す。
const STORAGE_KEY = 'kunitori:playerName';

interface ProfileState {
  name: string;       // 保存済みの表示名（未設定なら ''）
  hydrated: boolean;  // AsyncStorage 読み込み完了フラグ
  hydrate: () => Promise<void>;
  setName: (name: string) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  name: '',
  hydrated: false,

  hydrate: async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      set({ name: saved ?? '', hydrated: true });
    } catch {
      set({ hydrated: true }); // 読めなくても起動は止めない
    }
  },

  setName: (name) => {
    set({ name });
    // 保存は投げっぱなし（失敗してもUIは継続させる）。
    // 名前欄への入力は短く頻度も低いため、キーストロークごとの書き込みでも負荷は無視できる。
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
  },
}));
