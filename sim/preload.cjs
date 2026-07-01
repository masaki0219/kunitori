/**
 * selfplay.ts 用モックプリロード
 * React Native / Firebase の初期化が Node.js で失敗するため、
 * 実際に使われない依存のみスタブに差し替える。
 */
const Module = require('module');
const path = require('path');

const STUBS_DIR = path.join(__dirname, 'stubs');

const origResolve = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (id, parent, isMain, options) {
  if (id === '@react-native-async-storage/async-storage') {
    return path.join(STUBS_DIR, 'async-storage.cjs');
  }
  let resolved;
  try {
    resolved = origResolve(id, parent, isMain, options);
  } catch (e) {
    return origResolve(id, parent, isMain, options); // re-throw
  }
  // Firebase クライアント初期化をスタブに差し替え（env 変数なし環境で initializeApp が失敗するため）
  if (resolved.endsWith('firebaseClient.ts') || resolved.endsWith('firebaseClient.js')) {
    return path.join(STUBS_DIR, 'firebase-client.cjs');
  }
  return resolved;
};

const origLoad = Module._load.bind(Module);
Module._load = function (id, parent, isMain) {
  if (id === '@react-native-async-storage/async-storage') {
    return require(path.join(STUBS_DIR, 'async-storage.cjs'));
  }
  return origLoad(id, parent, isMain);
};
