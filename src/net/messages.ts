import { z } from 'zod';
import type { GameState, PlayerId, ResourceType } from '../game/types';
import type { CardPayload } from '../game/cards';

export type Role = 'host' | 'guest';
export type Seat = number; // = GameState.players[i].id（0始まり）
export type NetStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

export interface Member {
  seat: Seat; // 席番号（= プレイヤーID）
  name: string; // 表示名
  role: Role; // host / guest
  isAI: boolean; // ロビーでホストが追加したAI席なら true
  online: boolean; // presence による接続状態
  // 内部用（ホストのみ使用）: この席に対応する presence キー。配信時は LobbyMessageSchema が未知キーとして除去する。
  _presenceKey?: string;
}

export type Intent =
  | { t: 'placeSetupFort'; vertexId: number }
  | { t: 'placeSetupRoad'; edgeId: number }
  | { t: 'rollDice' }
  | { t: 'discardCards'; playerId: PlayerId; give: Partial<Record<ResourceType, number>> }
  | { t: 'moveBandit'; hexId: number }
  | { t: 'stealFrom'; targetId: PlayerId }
  | { t: 'buildRoad'; edgeId: number }
  | { t: 'buildFort'; vertexId: number }
  | { t: 'buildCastle'; vertexId: number }
  | { t: 'buyCard' }
  | { t: 'playCard'; index: number; payload?: CardPayload }
  | { t: 'bankTrade'; give: ResourceType; take: ResourceType }
  | {
      t: 'proposeTrade';
      toPlayer: PlayerId;
      give: Partial<Record<ResourceType, number>>;
      want: Partial<Record<ResourceType, number>>;
    }
  | { t: 'respondTrade'; accept: boolean }
  | { t: 'endTurn' };

export const EV = {
  intent: 'intent',
  snapshot: 'snapshot',
  lobby: 'lobby',
} as const;

// ゲスト → ホスト
export interface IntentMessage {
  msgId: string; // ユニークID（重複処理の排除に使う）
  fromSeat: Seat; // 送信者の席
  intent: Intent;
}

// ホスト → 全員
export interface SnapshotMessage {
  rev: number; // 単調増加。古い rev は無視する
  state: GameState; // 全状態（丸ごと）
}

// ホスト → 全員（対局開始前のロビー情報）
export interface LobbyMessage {
  members: Member[];
  started: boolean; // true になったら snapshot を待って対局画面へ
}

const resourceMap = z.record(
  z.enum(['timber', 'stone', 'rice', 'horse', 'iron']),
  z.number()
);

export const IntentSchema: z.ZodType<Intent> = z.discriminatedUnion('t', [
  z.object({ t: z.literal('placeSetupFort'), vertexId: z.number() }),
  z.object({ t: z.literal('placeSetupRoad'), edgeId: z.number() }),
  z.object({ t: z.literal('rollDice') }),
  z.object({ t: z.literal('discardCards'), playerId: z.number(), give: resourceMap }),
  z.object({ t: z.literal('moveBandit'), hexId: z.number() }),
  z.object({ t: z.literal('stealFrom'), targetId: z.number() }),
  z.object({ t: z.literal('buildRoad'), edgeId: z.number() }),
  z.object({ t: z.literal('buildFort'), vertexId: z.number() }),
  z.object({ t: z.literal('buildCastle'), vertexId: z.number() }),
  z.object({ t: z.literal('buyCard') }),
  z.object({ t: z.literal('playCard'), index: z.number(), payload: z.any().optional() }),
  z.object({
    t: z.literal('bankTrade'),
    give: z.enum(['timber', 'stone', 'rice', 'horse', 'iron']),
    take: z.enum(['timber', 'stone', 'rice', 'horse', 'iron']),
  }),
  z.object({ t: z.literal('proposeTrade'), toPlayer: z.number(), give: resourceMap, want: resourceMap }),
  z.object({ t: z.literal('respondTrade'), accept: z.boolean() }),
  z.object({ t: z.literal('endTurn') }),
]) as unknown as z.ZodType<Intent>;

export const IntentMessageSchema = z.object({
  msgId: z.string(),
  fromSeat: z.number(),
  intent: IntentSchema,
});

export const SnapshotMessageSchema = z.object({
  rev: z.number(),
  state: z
    .object({
      screen: z.string(),
      phase: z.string(),
      // .passthrough() が無いと zod が name/cards/resources 等の未定義キーを
      // 除去し、各プレイヤーが { id } だけに削られてしまう（実際に起きていた不具合）。
      players: z.array(z.object({ id: z.number() }).passthrough()).min(1),
      currentPlayer: z.number(),
    })
    .passthrough(),
});

export const LobbyMessageSchema = z.object({
  members: z.array(
    z.object({
      seat: z.number(),
      name: z.string(),
      role: z.enum(['host', 'guest']),
      isAI: z.boolean(),
      online: z.boolean(),
    })
  ),
  started: z.boolean(),
});
