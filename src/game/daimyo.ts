import { BANK_TRADE_RATE, NETWORK_MIN } from '../config/rules';
import { shuffle } from '../utils/random';
import { BuildingType, DaimyoId, Player, ResourceType } from './types';

export const DAIMYO_IDS: DaimyoId[] = ['oda', 'toyotomi', 'tokugawa'];

const RESOURCE_ORDER: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export function hasDaimyo(p: Player, id: DaimyoId): boolean {
  return p.daimyo === id;
}

// 織田の効果は自動裁定(daimyoRebalance)へ移したため、楽市レートは全員一律。
export function bankRateFor(_p: Player): number {
  return BANK_TRADE_RATE;
}

// 豊臣「一夜城」：建設コストの割引を適用したコストを返す。
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

// 織田「楽市楽座」：産出後、最も多く持つ資源(3以上)を1つ、最も少ない資源へ振り替える。
// 返り値は差し替え内容（from を1減らし to を1増やす）。動かす必要がなければ null。
export function daimyoRebalance(p: Player): { from: ResourceType; to: ResourceType } | null {
  if (!hasDaimyo(p, 'oda')) return null;
  let max = RESOURCE_ORDER[0];
  let min = RESOURCE_ORDER[0];
  for (const r of RESOURCE_ORDER) {
    if (p.resources[r] > p.resources[max]) max = r;
    if (p.resources[r] < p.resources[min]) min = r;
  }
  if (max === min) return null;
  if (p.resources[max] < 4) return null; // 明確な余剰(4以上)があるときだけ動かす
  return { from: max, to: min };
}

// 徳川「街道整備」：街道網の成立に必要な拠点数。通常 NETWORK_MIN(3)、徳川は 2。
export function networkMinFor(p: Player): number {
  return hasDaimyo(p, 'tokugawa') ? Math.max(2, NETWORK_MIN - 1) : NETWORK_MIN;
}

export const DAIMYO_LABELS: Record<DaimyoId, string> = {
  oda: '織田信長',
  toyotomi: '豊臣秀吉',
  tokugawa: '徳川家康',
};

export const DAIMYO_DESCRIPTIONS: Record<DaimyoId, string> = {
  oda: '楽市楽座：手番ごとに、余っている資源1つを最も足りない資源に自動で振り替える。',
  toyotomi: '一夜城：城の建設に必要な鉄が1少ない。',
  tokugawa: '街道整備：街道網が拠点2つで成立する（通常は3つ）。',
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
