import { ResourceType, Resources } from './types';

const ALL_RESOURCES: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

export function emptyResources(): Resources {
  return { timber: 0, stone: 0, rice: 0, horse: 0, iron: 0 };
}

export function countResources(r: Resources): number {
  return ALL_RESOURCES.reduce((sum, k) => sum + r[k], 0);
}

export function canAfford(r: Resources, cost: Partial<Resources>): boolean {
  return ALL_RESOURCES.every((k) => r[k] >= (cost[k] ?? 0));
}

export function payCost(r: Resources, cost: Partial<Resources>): Resources {
  const next = { ...r };
  for (const k of ALL_RESOURCES) {
    next[k] = next[k] - (cost[k] ?? 0);
  }
  return next;
}

export function addResources(r: Resources, add: Partial<Resources>): Resources {
  const next = { ...r };
  for (const k of ALL_RESOURCES) {
    next[k] = next[k] + (add[k] ?? 0);
  }
  return next;
}
