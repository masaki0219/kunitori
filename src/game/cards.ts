import { addResources } from './resources';
import { recomputeAfterBuild, updateLargestArmy } from './scoring';
import { CardType, GameState, ResourceType } from './types';

export interface HarvestPayload { picks: ResourceType[]; }
export interface RequisitionPayload { resource: ResourceType; }
export type CardPayload = HarvestPayload | RequisitionPayload | undefined;

export function canPlayCard(state: GameState, index: number): boolean {
  if (state.phase !== 'main') return false;
  const player = state.players.find((p) => p.id === state.currentPlayer)!;
  if (player.hasPlayedCardThisTurn) return false;
  const card = player.cards[index];
  if (!card || card === 'merit') return false;
  if (player.cardsBoughtThisTurn.includes(card)) return false;
  return true;
}

export function playCard(state: GameState, index: number, payload?: CardPayload): GameState {
  if (!canPlayCard(state, index)) return state;
  const playerId = state.currentPlayer;
  const player = state.players.find((p) => p.id === playerId)!;
  const card: CardType = player.cards[index];

  const removeCard = (p: typeof player) => {
    const cards = [...p.cards];
    cards.splice(cards.indexOf(card), 1);
    return cards;
  };

  switch (card) {
    case 'warlord': {
      const players = state.players.map((p) =>
        p.id === playerId
          ? { ...p, cards: removeCard(p), hasPlayedCardThisTurn: true, playedWarlords: p.playedWarlords + 1 }
          : p
      );
      const next: GameState = { ...state, players, phase: 'moveBandit' };
      return updateLargestArmy(next);
    }
    case 'construction': {
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, cards: removeCard(p), hasPlayedCardThisTurn: true } : p
      );
      return { ...state, players, freeRoadsLeft: 2 };
    }
    case 'harvest': {
      const picks = (payload as HarvestPayload | undefined)?.picks ?? [];
      if (picks.length !== 2) return state;
      const add: Partial<Record<ResourceType, number>> = {};
      for (const r of picks) add[r] = (add[r] ?? 0) + 1;
      const players = state.players.map((p) =>
        p.id === playerId
          ? { ...p, cards: removeCard(p), hasPlayedCardThisTurn: true, resources: addResources(p.resources, add) }
          : p
      );
      return { ...state, players };
    }
    case 'requisition': {
      const resource = (payload as RequisitionPayload | undefined)?.resource;
      if (!resource) return state;
      let collected = 0;
      const players = state.players.map((p) => {
        if (p.id === playerId) return p;
        collected += p.resources[resource];
        return { ...p, resources: { ...p.resources, [resource]: 0 } };
      });
      const finalPlayers = players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              cards: removeCard(p),
              hasPlayedCardThisTurn: true,
              resources: { ...p.resources, [resource]: p.resources[resource] + collected },
            }
          : p
      );
      return { ...state, players: finalPlayers };
    }
    default:
      return state;
  }
}

export function afterWarlordResolved(state: GameState): GameState {
  return recomputeAfterBuild(state);
}
