import { GameState } from './types';

export const LOG_MAX = 30;

/** state.log の末尾に1行追記し、LOG_MAX 件に丸めた新しい state を返す純関数。 */
export function appendLog(state: GameState, line: string): GameState {
  return { ...state, log: [...state.log, line].slice(-LOG_MAX) };
}
