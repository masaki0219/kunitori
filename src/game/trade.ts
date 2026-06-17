import { BANK_TRADE_RATE } from '../config/rules';
import { canAfford, payCost, addResources } from './resources';
import { GameState, PlayerId, ResourceType } from './types';

export function bankTrade(state: GameState, give: ResourceType, take: ResourceType): GameState {
  if (state.phase !== 'main') return state;
  const playerId = state.currentPlayer;
  const player = state.players.find((p) => p.id === playerId)!;
  if (!canAfford(player.resources, { [give]: BANK_TRADE_RATE })) return state;

  const players = state.players.map((p) => {
    if (p.id !== playerId) return p;
    let resources = payCost(p.resources, { [give]: BANK_TRADE_RATE });
    resources = addResources(resources, { [take]: 1 });
    return { ...p, resources };
  });

  return { ...state, players };
}

export function proposeTrade(
  state: GameState,
  toPlayer: PlayerId,
  give: Partial<Record<ResourceType, number>>,
  want: Partial<Record<ResourceType, number>>
): GameState {
  if (state.phase !== 'main') return state;
  const fromPlayer = state.currentPlayer;
  const from = state.players.find((p) => p.id === fromPlayer)!;
  const to = state.players.find((p) => p.id === toPlayer)!;
  if (!canAfford(from.resources, give)) return state;
  if (!canAfford(to.resources, want)) return state;

  return { ...state, pendingTrade: { from: fromPlayer, to: toPlayer, give, want } };
}

export function respondTrade(state: GameState, accept: boolean): GameState {
  const trade = state.pendingTrade;
  if (!trade) return state;

  if (!accept) {
    return { ...state, pendingTrade: null };
  }

  const players = state.players.map((p) => {
    if (p.id === trade.from) {
      let resources = payCost(p.resources, trade.give);
      resources = addResources(resources, trade.want);
      return { ...p, resources };
    }
    if (p.id === trade.to) {
      let resources = payCost(p.resources, trade.want);
      resources = addResources(resources, trade.give);
      return { ...p, resources };
    }
    return p;
  });

  return { ...state, players, pendingTrade: null };
}
