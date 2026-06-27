import { create } from 'zustand';
import { discardCards as discardCardsFn, moveBandit as moveBanditFn, stealFrom as stealFromFn } from '../game/bandit';
import { buildBoardGeometry } from '../game/board';
import { buildCastle as buildCastleFn, buildFort as buildFortFn, buildRoad as buildRoadFn, recruitVassal as recruitVassalFn } from '../game/build';
import { rollAndProduce } from '../game/production';
import { createInitialGame, placeSetupFort as placeSetupFortFn, placeSetupRoad as placeSetupRoadFn } from '../game/setup';
import { bankTrade as bankTradeFn, proposeTrade as proposeTradeFn, respondTrade as respondTradeFn } from '../game/trade';
import { GameState, PlayerId, ResourceType } from '../game/types';

function placeholderState(): GameState {
  return {
    screen: 'title',
    phase: 'roll',
    board: buildBoardGeometry(),
    terrainSeed: 0,
    buildings: [],
    roads: [],
    banditHexId: -1,
    players: [],
    currentPlayer: 0,
    vassalDeck: [],
    dice: null,
    pendingTrade: null,
    discardQueue: [],
    setup: { order: [], index: 0, pendingRoadFromVertex: null },
    winner: null,
    log: [],
  };
}

interface GameStore extends GameState {
  goToScreen: (s: GameState['screen']) => void;
  startGame: (config: { players: { name: string; isAI: boolean }[] }) => void;
  placeSetupFort: (vertexId: number) => void;
  placeSetupRoad: (edgeId: number) => void;

  rollDice: () => void;
  discardCards: (playerId: PlayerId, give: Partial<Record<ResourceType, number>>) => void;
  moveBandit: (hexId: number) => void;
  stealFrom: (targetId: PlayerId) => void;

  buildRoad: (edgeId: number) => void;
  buildFort: (vertexId: number) => void;
  buildCastle: (vertexId: number) => void;
  recruitVassal: () => void;

  bankTrade: (give: ResourceType, take: ResourceType) => void;
  proposeTrade: (
    toPlayer: PlayerId,
    give: Partial<Record<ResourceType, number>>,
    want: Partial<Record<ResourceType, number>>
  ) => void;
  respondTrade: (accept: boolean) => void;

  endTurn: () => void;
  resetGame: () => void;
  quitToHome: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...placeholderState(),

  goToScreen: (s) => set({ screen: s }),

  startGame: (config) => set(createInitialGame(config)),

  placeSetupFort: (vertexId) => set((state) => placeSetupFortFn(state, vertexId)),
  placeSetupRoad: (edgeId) => set((state) => placeSetupRoadFn(state, edgeId)),

  rollDice: () => set((state) => rollAndProduce(state)),
  discardCards: (playerId, give) => set((state) => discardCardsFn(state, playerId, give)),
  moveBandit: (hexId) => set((state) => moveBanditFn(state, hexId)),
  stealFrom: (targetId) => set((state) => stealFromFn(state, targetId)),

  buildRoad: (edgeId) => set((state) => buildRoadFn(state, edgeId)),
  buildFort: (vertexId) => set((state) => buildFortFn(state, vertexId)),
  buildCastle: (vertexId) => set((state) => buildCastleFn(state, vertexId)),
  recruitVassal: () => set((state) => recruitVassalFn(state)),

  bankTrade: (give, take) => set((state) => bankTradeFn(state, give, take)),
  proposeTrade: (toPlayer, give, want) => set((state) => proposeTradeFn(state, toPlayer, give, want)),
  respondTrade: (accept) => set((state) => respondTradeFn(state, accept)),

  endTurn: () =>
    set((state) => {
      const currentPlayer = (state.currentPlayer + 1) % state.players.length;
      return { ...state, currentPlayer, phase: 'roll', dice: null };
    }),

  resetGame: () => set({ ...placeholderState(), screen: 'setup' }),

  quitToHome: () => set({ ...placeholderState(), screen: 'home' }),
}));
