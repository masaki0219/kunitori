import { useGameStore } from '../store/gameStore';
import type { GameState } from '../game/types';
import type { Intent, Seat } from './messages';

/** ホストでのみ呼ぶ。Intent を既存ストアアクションへ写像して実行する。 */
export function applyIntentOnHost(intent: Intent): void {
  const s = useGameStore.getState();
  switch (intent.t) {
    case 'placeSetupFort': s.placeSetupFort(intent.vertexId); break;
    case 'placeSetupRoad': s.placeSetupRoad(intent.edgeId); break;
    case 'rollDice':       s.rollDice(); break;
    case 'discardCards':   s.discardCards(intent.playerId, intent.give); break;
    case 'moveBandit':     s.moveBandit(intent.hexId); break;
    case 'stealFrom':      s.stealFrom(intent.targetId); break;
    case 'buildRoad':      s.buildRoad(intent.edgeId); break;
    case 'buildFort':      s.buildFort(intent.vertexId); break;
    case 'buildCastle':    s.buildCastle(intent.vertexId); break;
    case 'recruitVassal':  s.recruitVassal(); break;
    case 'bankTrade':      s.bankTrade(intent.give, intent.take); break;
    case 'proposeTrade':   s.proposeTrade(intent.toPlayer, intent.give, intent.want); break;
    case 'respondTrade':   s.respondTrade(intent.accept); break;
    case 'endTurn':        s.endTurn(); break;
  }
}

/**
 * ホストでのみ呼ぶ。fromSeat がこの Intent を今出してよいかを検証。
 * 不正なら false（黙って捨てる）。既存ロジックも二重に弾くので、ここは軽い前段チェックでよい。
 */
export function validateIntent(state: GameState, intent: Intent, fromSeat: Seat): boolean {
  switch (intent.t) {
    // 自分の手番のプレイヤーだけが出せる操作
    case 'placeSetupFort':
    case 'placeSetupRoad':
    case 'rollDice':
    case 'moveBandit':
    case 'stealFrom':
    case 'buildRoad':
    case 'buildFort':
    case 'buildCastle':
    case 'recruitVassal':
    case 'bankTrade':
    case 'proposeTrade':
    case 'endTurn':
      return state.currentPlayer === fromSeat;

    // 破棄は「破棄待ち行列に入っている本人」だけ
    case 'discardCards':
      return intent.playerId === fromSeat && state.discardQueue.includes(fromSeat);

    // 交易への返答は「提案を受けた本人」だけ
    case 'respondTrade':
      return state.pendingTrade?.to === fromSeat;

    default:
      return false;
  }
}
