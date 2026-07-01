/**
 * AI自己対戦による大名別勝率の計測（ヘッドレス実行）
 *
 * 置き場所: リポジトリ直下に `sim/` を作り、このファイルを `sim/selfplay.ts` として置く。
 * 実行:
 *   npm run selfplay            # 既定 2000 対局×2モード
 *   npm run selfplay -- 5000    # 対局数を指定
 *
 * 仕組み:
 *   - あなたの本物のストア(gameStore)と本物のAI(runAISetupTurn / runAITurn)をそのまま呼ぶ。
 *   - setAIStepDelayScale(0) で待機を消し、React を介さず手番ループを自前で回すだけ。
 *   - 別実装のAIではないので、測っているのは「実機と同じAIの」勝率。
 *
 * 前提（重要）:
 *   1. 三英傑スペック（Player.daimyo / daimyo.ts / setup.ts の割当）が適用済みであること。
 *      未適用だと全員 daimyo 無しになり、何も測れない。
 *   2. 豊臣を正しく測るには「配線修正(§1: aiPlayer が applyDaimyoCost 経由で城コストを判断)」も
 *      適用済みであること。未適用だとAI豊臣が割引を使えず、豊臣が過小評価される。
 *
 * 注意:
 *   - 乱数は Math.random()（未シード）。各対局は独立。多数回の平均で評価する。
 *   - AIは大名ごとの戦略を持たない。あくまで「能力の機械的な有利さ」を測る指標。
 *   - 出力の ±値は95%信頼区間の半幅。fair(公平値)を跨いでいれば「有意差なし＝誤差の範囲」。
 */

import { useGameStore } from '../src/store/gameStore';
import { runAISetupTurn, runAITurn, setAIStepDelayScale } from '../src/ai/aiPlayer';
import { computePrestige } from '../src/game/scoring';
import { DAIMYO_IDS, DAIMYO_LABELS } from '../src/game/daimyo';
import type { DaimyoId } from '../src/game/types';

const TURN_CAP = 600; // 1対局あたりの手番反復上限（万一終わらない対局の保険）

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface GameResult {
  winnerSeat: number | null;
  winnerDaimyo: DaimyoId | null;
  seatDaimyos: DaimyoId[];
  turns: number;
  capped: boolean;
}

/** 1対局を最後まで回し、勝者の席と大名を返す。assignment[seat] = その席の大名。 */
async function playOneGame(assignment: DaimyoId[]): Promise<GameResult> {
  const players = assignment.map((d, i) => ({ name: `AI${i}`, isAI: true, daimyo: d }));
  // startGame の型が daimyo を含まなくても、実体は createInitialGame が読むso as any で回避。
  useGameStore.getState().startGame({ players } as any);

  await runAISetupTurn();

  let turns = 0;
  let capped = false;
  while (true) {
    const s = useGameStore.getState();
    if (s.phase === 'gameOver' || s.winner !== null) break;
    if (turns >= TURN_CAP) { capped = true; break; }
    await runAITurn();
    turns++;
  }

  const s = useGameStore.getState();
  let winnerSeat: number | null = s.winner;
  if (winnerSeat === null) {
    // 上限打ち切り時は威信最大を暫定勝者（同点は若い席）
    let best = -Infinity;
    for (const p of s.players) {
      const pts = computePrestige(s, p.id);
      if (pts > best) { best = pts; winnerSeat = p.id; }
    }
  }

  return {
    winnerSeat,
    winnerDaimyo: winnerSeat != null ? assignment[winnerSeat] : null,
    seatDaimyos: assignment,
    turns,
    capped,
  };
}

// ===== 集計 =====

interface Agg {
  seats: Record<DaimyoId, number>; // 大名ごとの出場席数（＝分母）
  wins: Record<DaimyoId, number>;  // 大名ごとの勝利数
  seatWins: number[];              // 席番号別の勝利数（手番順の有利さ検証用）
  seatGames: number[];
  totalTurns: number;
  cappedGames: number;
  games: number;
}

function newAgg(seatCount: number): Agg {
  const zero = () => DAIMYO_IDS.reduce((o, d) => { o[d] = 0; return o; }, {} as Record<DaimyoId, number>);
  return {
    seats: zero(), wins: zero(),
    seatWins: Array(seatCount).fill(0), seatGames: Array(seatCount).fill(0),
    totalTurns: 0, cappedGames: 0, games: 0,
  };
}

function record(agg: Agg, r: GameResult): void {
  agg.games++;
  agg.totalTurns += r.turns;
  if (r.capped) agg.cappedGames++;
  r.seatDaimyos.forEach((d, seat) => { agg.seats[d]++; agg.seatGames[seat]++; });
  if (r.winnerDaimyo) agg.wins[r.winnerDaimyo]++;
  if (r.winnerSeat != null) agg.seatWins[r.winnerSeat]++;
}

function ci95(wins: number, n: number): { rate: number; half: number } {
  if (n === 0) return { rate: 0, half: 0 };
  const p = wins / n;
  return { rate: p, half: 1.96 * Math.sqrt((p * (1 - p)) / n) };
}

function pct(x: number): string {
  return (x * 100).toFixed(1).padStart(5) + '%';
}

function report(title: string, agg: Agg, seatCount: number): void {
  const fair = 1 / seatCount; // 席正規化した公平値（3人=33.3%, 4人=25.0%）
  console.log('\n' + '='.repeat(64));
  console.log(title);
  console.log(`対局数 ${agg.games} / 平均手番 ${(agg.totalTurns / agg.games).toFixed(1)}` +
    (agg.cappedGames ? ` / 上限打切 ${agg.cappedGames}` : ''));
  console.log(`公平値 ${pct(fair)}（これを信頼区間が跨げば誤差の範囲）`);
  console.log('-'.repeat(64));
  console.log('大名        出場   勝  勝率    ±95%CI   対公平   判定');
  for (const d of DAIMYO_IDS) {
    const n = agg.seats[d];
    const w = agg.wins[d];
    const { rate, half } = ci95(w, n);
    const delta = rate - fair;
    let verdict = '誤差内';
    if (rate - half > fair) verdict = '★強い';
    else if (rate + half < fair) verdict = '▽弱い';
    const label = (DAIMYO_LABELS[d] ?? d).padEnd(6, '　');
    console.log(
      `${label} ${String(n).padStart(6)} ${String(w).padStart(4)}  ${pct(rate)}  ±${pct(half).trim().padStart(5)}` +
      `  ${(delta >= 0 ? '+' : '') + (delta * 100).toFixed(1)}%`.padStart(9) +
      `   ${verdict}`
    );
  }
  console.log('-'.repeat(64));
  const seatRates = agg.seatGames.map((g, i) => (g ? agg.seatWins[i] / g : 0));
  console.log('手番順の勝率: ' + seatRates.map((r, i) => `席${i}=${pct(r)}`).join('  '));
  console.log('（席0ほど高ければ先手有利。大名割当はランダムなので大名比較には影響しない）');
}

// ===== 実行 =====

async function main(): Promise<void> {
  const games = Number(process.argv[2] ?? 2000);
  console.log(`AI自己対戦を開始（各モード ${games} 対局）...`);
  setAIStepDelayScale(0); // 待機を消して高速化

  const aggA = newAgg(3); // 3人・各大名1（最もクリーンな比較）
  const aggB = newAgg(4); // 4人・1種重複（飽和/雪だるま検証）
  let failures = 0;

  for (let g = 0; g < games; g++) {
    // モードA: 3人、各大名ちょうど1回、席順はランダム
    try { record(aggA, await playOneGame(shuffle([...DAIMYO_IDS]))); }
    catch (e) { failures++; }

    // モードB: 4人、3種＋ランダムに1種重複、席順はランダム
    try {
      const dup = DAIMYO_IDS[Math.floor(Math.random() * DAIMYO_IDS.length)];
      record(aggB, await playOneGame(shuffle([...DAIMYO_IDS, dup])));
    } catch (e) { failures++; }

    if ((g + 1) % 200 === 0) console.log(`  ... ${g + 1}/${games}`);
  }

  report('モードA：3人戦（各大名1・最もクリーンな比較）', aggA, 3);
  report('モードB：4人戦（1種重複・飽和/雪だるま検証）', aggB, 4);
  if (failures) console.log(`\n（注）例外で打切った対局: ${failures} 件`);
  console.log('\n読み方: ★や▽が付いた大名だけが「誤差でなく有意」に強い/弱い。');
  console.log('       全部「誤差内」なら現状バランスは概ね均衡。');
}

main().catch((e) => { console.error(e); process.exit(1); });
