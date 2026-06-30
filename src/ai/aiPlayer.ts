import { COSTS, AI_TRADE_LOOP_LIMIT } from '../config/rules';
import { playersAdjacentToHex } from '../game/board';
import { getBuildableEdges, getBuildableVertices, getUpgradableForts } from '../game/build';
import { canAfford } from '../game/resources';
import { computePrestige } from '../game/scoring';
import { isValidSetupFort } from '../game/setup';
import { effectiveTradeRate } from '../game/trade';
import { GameState, Player, PlayerId, ResourceType ,Resources} from '../game/types';
import { useGameStore } from '../store/gameStore';
import { useNetStore } from '../net/netStore';
import { chooseRoadTarget, evalTargetVertex, scoreVertex } from './aiStrategy';

const ALL_RESOURCES: ResourceType[] = ['timber', 'stone', 'rice', 'horse', 'iron'];

// テスト時は setAIStepDelayScale(0) にして待機をスキップする
let aiStepDelayScale = 1;
export function setAIStepDelayScale(scale: number): void {
  aiStepDelayScale = scale;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms * aiStepDelayScale));
}


export function chooseSetupFort(state: GameState): number {
  const candidates = state.board.vertices.filter((v) => {
    const hasBuilding = state.buildings.some((b) => b.vertexId === v.id);
    if (hasBuilding) return false;
    return !v.neighborVertexIds.some((nid) => state.buildings.some((b) => b.vertexId === nid));
  });
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const v of candidates) {
    const s = scoreVertex(state, v.id);
    if (s > bestScore) { bestScore = s; best = v; }
  }
  return best.id;
}

export function chooseSetupRoad(state: GameState, fromVertex: number): number {
  const vertex = state.board.vertices[fromVertex];
  const candidates = vertex.edgeIds.filter((eid) => !state.roads.some((r) => r.edgeId === eid));
  if (candidates.length === 0) return vertex.edgeIds[0];

  let bestEdge = candidates[0];
  let bestVal = -Infinity;
  for (const eid of candidates) {
    const e = state.board.edges[eid];
    const far = e.vertexIds[0] === fromVertex ? e.vertexIds[1] : e.vertexIds[0];
    let val = isValidSetupFort(state, far) ? evalTargetVertex(state, state.currentPlayer, far) : 0;
    const farV = state.board.vertices[far];
    for (const nv of farV.neighborVertexIds) {
      if (isValidSetupFort(state, nv)) {
        val = Math.max(val, evalTargetVertex(state, state.currentPlayer, nv));
      }
    }
    if (val > bestVal) { bestVal = val; bestEdge = eid; }
  }
  return bestEdge;
}

function mostHeldResource(resources: Resources): ResourceType {
  return ALL_RESOURCES.reduce((best, r) => (resources[r] > resources[best] ? r : best), ALL_RESOURCES[0]);
}

export function autoDiscard(player: Player): Partial<Record<ResourceType, number>> {
  const total = ALL_RESOURCES.reduce((s, r) => s + player.resources[r], 0);
  const required = Math.floor(total / 2);
  const remaining = { ...player.resources };
  const give: Partial<Record<ResourceType, number>> = {};
  let left = required;
  while (left > 0) {
    const r = mostHeldResource(remaining);
    if (remaining[r] <= 0) break;
    remaining[r] -= 1;
    give[r] = (give[r] ?? 0) + 1;
    left -= 1;
  }
  return give;
}

export function chooseBanditHex(state: GameState): number {
  const others = state.players.filter((p) => p.id !== state.currentPlayer);
  const leader = others.reduce((best, p) => (computePrestige(state, p.id) > computePrestige(state, best.id) ? p : best), others[0]);

  const candidates = state.board.hexes.filter((h) => h.id !== state.banditHexId);
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const hex of candidates) {
    const owners = playersAdjacentToHex(state, hex.id);
    let score = 0;
    if (owners.includes(state.currentPlayer)) score -= 100;
    if (leader && owners.includes(leader.id)) score += 10;
    score += owners.length;
    if (score > bestScore) { bestScore = score; best = hex; }
  }
  return best.id;
}

export function chooseStealTarget(state: GameState, candidates: PlayerId[]): PlayerId {
  return candidates.reduce((best, id) => {
    const p = state.players.find((pp) => pp.id === id)!;
    const bestP = state.players.find((pp) => pp.id === best)!;
    const total = ALL_RESOURCES.reduce((s, r) => s + p.resources[r], 0);
    const bestTotal = ALL_RESOURCES.reduce((s, r) => s + bestP.resources[r], 0);
    return total > bestTotal ? id : best;
  }, candidates[0]);
}

export function aiEvaluateTrade(player: Player, give: Partial<Record<ResourceType, number>>, want: Partial<Record<ResourceType, number>>): boolean {
  // player is being asked to give `want` resources and receive `give` resources (offer perspective: from proposer's POV)
  // Here, `give`=what proposer gives (this player receives), `want`=what proposer wants (this player gives)
  for (const r of ALL_RESOURCES) {
    const giving = want[r] ?? 0;
    const receiving = give[r] ?? 0;
    const owned = player.resources?.[r] ?? 0;
    if (giving > 0 && owned < 4) return false; // would give away a scarce resource
    if (receiving > 0 && owned > 1) return false; // doesn't need it
  }
  const totalReceiving = ALL_RESOURCES.reduce((s, r) => s + (give[r] ?? 0), 0);
  const totalGiving = ALL_RESOURCES.reduce((s, r) => s + (want[r] ?? 0), 0);
  return totalReceiving > 0 && totalGiving > 0;
}

async function tryBuild(state: GameState): Promise<boolean> {
  const store = useGameStore.getState();
  const playerId = state.currentPlayer;
  const player = state.players.find((p) => p.id === playerId)!;

  const upgradable = getUpgradableForts(state, playerId);
  if (upgradable.length > 0 && canAfford(player.resources, COSTS.castle)) {
    store.buildCastle(upgradable[0]);
    return true;
  }

  const buildableVertices = getBuildableVertices(state, playerId);
  if (buildableVertices.length > 0 && canAfford(player.resources, COSTS.fort)) {
    let best = buildableVertices[0];
    let bestScore = -Infinity;
    for (const v of buildableVertices) {
      const s = scoreVertex(state, v);
      if (s > bestScore) { bestScore = s; best = v; }
    }
    store.buildFort(best);
    return true;
  }

  const buildableEdges = getBuildableEdges(state, playerId);
  if (buildableEdges.length > 0 && canAfford(player.resources, COSTS.road)) {
    const target = chooseRoadTarget(state, playerId);
    if (target && buildableEdges.includes(target.firstEdge)) {
      store.buildRoad(target.firstEdge);
      return true;
    }
    store.buildRoad(buildableEdges[0]);
    return true;
  }

  return false;
}

function tryBankTradeTowardCost(state: GameState, cost: Partial<Record<ResourceType, number>>): boolean {
  const store = useGameStore.getState();
  const player = state.players.find((p) => p.id === state.currentPlayer)!;
  for (const need of ALL_RESOURCES) {
    const needed = (cost[need] ?? 0) - player.resources[need];
    if (needed <= 0) continue;
    const surplus = ALL_RESOURCES.find((r) => r !== need && player.resources[r] >= effectiveTradeRate(state, state.currentPlayer, r));
    if (surplus) {
      store.bankTrade(surplus, need);
      return true;
    }
  }
  return false;
}

async function runMainPhase(): Promise<void> {
  let tradeCount = 0;
  for (let i = 0; i < 30; i++) {
    const state = useGameStore.getState();
    if (state.phase !== 'main') return;

    const built = await tryBuild(state);
    if (built) {
      await delay(500);
      continue;
    }

    if (tradeCount < AI_TRADE_LOOP_LIMIT) {
      const upgradable = getUpgradableForts(state, state.currentPlayer);
      const connectedFort = getBuildableVertices(state, state.currentPlayer).length > 0;

      let goalCost = COSTS.road;
      if (upgradable.length > 0) goalCost = COSTS.castle;
      else if (connectedFort) goalCost = COSTS.fort;

      const traded = tryBankTradeTowardCost(state, goalCost);
      if (traded) {
        tradeCount++;
        await delay(400);
        continue;
      }
    }

    const player = state.players.find((p) => p.id === state.currentPlayer)!;
    if (state.vassalDeck.length > 0 && canAfford(player.resources, COSTS.card)) {
      useGameStore.getState().recruitVassal();
      await delay(400);
      continue;
    }

    break;
  }
}

// discardQueue 内のAI/代行プレイヤーを自動で破棄処理する。人間プレイヤーはDiscardModal側で処理する。
export async function resolveAIDiscards(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const state = useGameStore.getState();
    if (state.phase !== 'discard') return;
    const net = useNetStore.getState();
    const aiId = state.discardQueue.find((id) => {
      const pl = state.players.find((p) => p.id === id);
      return pl?.isAI || net.isAutoPlayedSeat(id);
    });
    if (aiId === undefined) return; // 残りは人間待ち、またはキュー空
    const p = state.players.find((pp) => pp.id === aiId)!;
    useGameStore.getState().discardCards(aiId, autoDiscard(p));
    await delay(200);
  }
}

export async function runAISetupTurn(): Promise<void> {
  while (true) {
    const state = useGameStore.getState();
    const player = state.players.find((p) => p.id === state.currentPlayer)!;
    if (!player.isAI && !useNetStore.getState().isAutoPlayedSeat(player.id)) return;
    if (state.phase !== 'setupPlacement') return;
    if (state.setup.pendingRoadFromVertex !== null) return;

    const vertexId = chooseSetupFort(state);
    useGameStore.getState().placeSetupFort(vertexId);
    await delay(350);

    const edgeId = chooseSetupRoad(useGameStore.getState(), vertexId);
    useGameStore.getState().placeSetupRoad(edgeId);
    await delay(350);
  }
}

export async function runAITurn(): Promise<void> {
  let state = useGameStore.getState();
  const player = state.players.find((p) => p.id === state.currentPlayer)!;
  if (!player.isAI && !useNetStore.getState().isAutoPlayedSeat(player.id)) return;

  if (state.phase === 'moveBandit') {
    const hexId = chooseBanditHex(state);
    useGameStore.getState().moveBandit(hexId);
    await delay(400);
  }

  state = useGameStore.getState();
  if (state.phase === 'steal') {
    const candidates = playersAdjacentToHex(state, state.banditHexId).filter((id) => id !== state.currentPlayer);
    if (candidates.length > 0) {
      useGameStore.getState().stealFrom(chooseStealTarget(state, candidates));
      await delay(400);
    }
  }

  state = useGameStore.getState();
  if (state.phase === 'roll') {
    useGameStore.getState().rollDice();
    await delay(500);
  }

  await resolveAIDiscards();

  state = useGameStore.getState();
  if (state.phase === 'moveBandit') {
    const hexId = chooseBanditHex(state);
    useGameStore.getState().moveBandit(hexId);
    await delay(400);
  }

  state = useGameStore.getState();
  if (state.phase === 'steal') {
    const candidates = playersAdjacentToHex(state, state.banditHexId).filter((id) => id !== state.currentPlayer);
    if (candidates.length > 0) {
      useGameStore.getState().stealFrom(chooseStealTarget(state, candidates));
      await delay(400);
    }
  }

  state = useGameStore.getState();
  if (state.phase === 'main') {
    await runMainPhase();
  }

  state = useGameStore.getState();
  if (state.phase === 'main') {
    useGameStore.getState().endTurn();
  }
}
