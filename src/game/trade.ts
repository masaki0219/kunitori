import { canAfford, payCost, addResources } from './resources';
import { bankRateFor } from './daimyo';
import { tradeRateDelta } from './vassals';
import { appendLog } from './log';
import { RESOURCE_SHORT_LABELS } from '../config/labels';
import { GameState, PlayerId, ResourceType } from './types';

// プレイヤーが建物を置いている港を考慮した、give 資源の最良（最小）レート
export function effectiveTradeRate(state: GameState, playerId: PlayerId, give: ResourceType): number {
  const player = state.players.find((p) => p.id === playerId)!;
  let rate = bankRateFor(player);
  const myVertexIds = new Set(
    state.buildings.filter((b) => b.owner === playerId).map((b) => b.vertexId)
  );
  for (const port of state.board.ports) {
    const owned = port.vertexIds.some((vid) => myVertexIds.has(vid));
    if (!owned) continue;
    if (port.resource === give) rate = Math.min(rate, port.rate);        // 湊2:1
  }
  return Math.max(2, rate + tradeRateDelta(player));
}

export function bankTrade(state: GameState, give: ResourceType, take: ResourceType): GameState {
  if (state.phase !== 'main') return state;
  const playerId = state.currentPlayer;
  const player = state.players.find((p) => p.id === playerId)!;
  const rate = effectiveTradeRate(state, playerId, give);
  if (!canAfford(player.resources, { [give]: rate })) return state;

  const players = state.players.map((p) => {
    if (p.id !== playerId) return p;
    let resources = payCost(p.resources, { [give]: rate });
    resources = addResources(resources, { [take]: 1 });
    return { ...p, resources };
  });

  return appendLog({ ...state, players }, `${player.name}が${RESOURCE_SHORT_LABELS[give]}を${RESOURCE_SHORT_LABELS[take]}に交換しました`);
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

  const fromName = state.players.find((p) => p.id === trade.from)?.name ?? '';
  const toName = state.players.find((p) => p.id === trade.to)?.name ?? '';
  return appendLog({ ...state, players, pendingTrade: null }, `${fromName}が${toName}と取引しました`);
}
