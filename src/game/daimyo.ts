import { BANK_TRADE_RATE } from '../config/rules';
import { shuffle } from '../utils/random';
import { BuildingType, DaimyoId, Player, ResourceType } from './types';

export const DAIMYO_IDS: DaimyoId[] = ['oda', 'toyotomi', 'tokugawa'];

const RESOURCE_ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export function hasDaimyo(p: Player, id: DaimyoId): boolean {
  return p.daimyo === id;
}

export function bankRateFor(p: Player): number {
  return hasDaimyo(p, 'oda') ? 2 : BANK_TRADE_RATE;
}

export function applyDaimyoCost(
  p: Player,
  type: BuildingType | 'road' | 'card',
  base: Partial<Record<ResourceType, number>>
): Partial<Record<ResourceType, number>> {
  const cost = { ...base };
  if (hasDaimyo(p, 'toyotomi') && type === 'castle' && cost.iron) {
    cost.iron = Math.max(0, cost.iron - 1);
  }
  return cost;
}

export function daimyoTurnIncome(p: Player): Partial<Record<ResourceType, number>> {
  if (!hasDaimyo(p, 'tokugawa')) return {};
  let target = RESOURCE_ORDER[0];
  for (const r of RESOURCE_ORDER) {
    if (p.resources[r] < p.resources[target]) target = r;
  }
  if (p.resources[target] > 0) return {};
  return { [target]: 1 };
}

export const DAIMYO_LABELS: Record<DaimyoId, string> = {
  oda: '織田信長',
  toyotomi: '豊臣秀吉',
  tokugawa: '徳川家康',
};

export const DAIMYO_DESCRIPTIONS: Record<DaimyoId, string> = {
  oda: '楽市楽座：楽市（銀行交易）が2つで好きな資源1つと交換できる。',
  toyotomi: '一夜城：城の建設に必要な鉄が1少ない。',
  tokugawa: '地道な国造り：手番のはじめに、切らしている資源があれば1つ得る。',
};

export function assignDaimyos(count: number, provided?: (DaimyoId | undefined)[]): DaimyoId[] {
  const result: DaimyoId[] = [];
  const used = new Set<DaimyoId>();
  const pool = shuffle([...DAIMYO_IDS]);
  for (let i = 0; i < count; i++) {
    const want = provided?.[i];
    if (want) { result.push(want); used.add(want); continue; }
    const pick = pool.find((d) => !used.has(d)) ?? DAIMYO_IDS[i % DAIMYO_IDS.length];
    result.push(pick); used.add(pick);
  }
  return result;
}
