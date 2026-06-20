import { VASSAL_DECK_COUNTS } from '../config/rules';
import { shuffle } from '../utils/random';
import { Player, ResourceType, VassalId } from './types';

export const VASSAL_PRESTIGE: Record<VassalId, number> = {
  fushin: 0, gunshi: 0, kaisen: 0, daikan: 0, kura: 0, hatamoto: 1,
};

export function hasVassal(p: Player, id: VassalId): boolean {
  return p.vassals.includes(id);
}

// 普請奉行：街道コストの石を1減らす（下限0）。実際に支払うコストを返す。
export function roadCostFor(
  p: Player,
  base: Partial<Record<ResourceType, number>>
): Partial<Record<ResourceType, number>> {
  if (!hasVassal(p, 'fushin')) return base;
  const cost = { ...base };
  if (cost.stone) cost.stone = Math.max(0, cost.stone - 1);
  return cost;
}

// 廻船問屋：交易レート −1。
export function tradeRateDelta(p: Player): number {
  return hasVassal(p, 'kaisen') ? -1 : 0;
}

// 代官：手番のサイコロ後の追加収入。
export function turnIncome(p: Player): Partial<Record<ResourceType, number>> {
  return hasVassal(p, 'daikan') ? { rice: 1 } : {};
}

// 蔵奉行：一揆(7)の供出を免除。
export function isDiscardExempt(p: Player): boolean {
  return hasVassal(p, 'kura');
}

// 軍師：略奪枚数。
export function stealCount(p: Player): number {
  return hasVassal(p, 'gunshi') ? 2 : 1;
}

// 旗本：常時威信。
export function prestigeFromVassals(p: Player): number {
  return p.vassals.reduce((s, id) => s + VASSAL_PRESTIGE[id], 0);
}

export function buildVassalDeck(): VassalId[] {
  const deck: VassalId[] = [];
  (Object.keys(VASSAL_DECK_COUNTS) as VassalId[]).forEach((id) => {
    for (let i = 0; i < VASSAL_DECK_COUNTS[id]; i++) deck.push(id);
  });
  return shuffle(deck);
}
