import type { Member } from './messages';

export interface TransportHandlers {
  /** broadcast を受信したとき（event名と生payload） */
  onMessage: (event: string, payload: unknown) => void;
  /** presence が変化したとき（現在の在室者: presenceキー → 各自が track した meta のマップ） */
  onPresenceChange: (present: Record<string, Partial<Member>>) => void;
  /** 接続状態が変化したとき */
  onStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export interface NetTransport {
  /** 部屋（チャンネル）へ接続。self は presence 用の自分の識別情報 */
  join(roomCode: string, self: { key: string; meta: Partial<Member> }, h: TransportHandlers): Promise<void>;
  /** event名を指定して payload を全員へ送る */
  send(event: string, payload: unknown): Promise<void>;
  /** 退室・後始末 */
  leave(): Promise<void>;
}
