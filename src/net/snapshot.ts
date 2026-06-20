import type { GameState } from '../game/types';
import type { useGameStore } from '../store/gameStore';

type Store = ReturnType<typeof useGameStore.getState>;

/** ストアから GameState のデータ部分だけを取り出す（関数は含めない）。 */
export function toSnapshotState(s: Store): GameState {
  return {
    screen: s.screen, phase: s.phase, board: s.board, terrainSeed: s.terrainSeed,
    buildings: s.buildings, roads: s.roads, banditHexId: s.banditHexId,
    players: s.players, currentPlayer: s.currentPlayer, deck: s.deck, dice: s.dice,
    largestArmyHolder: s.largestArmyHolder,
    pendingTrade: s.pendingTrade, discardQueue: s.discardQueue, freeRoadsLeft: s.freeRoadsLeft,
    setup: s.setup, winner: s.winner, log: s.log,
  };
}
