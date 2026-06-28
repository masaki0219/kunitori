export interface StampDef {
  id: string;
  emoji: string;
  label: string;
}

export const STAMPS: StampDef[] = [
  { id: 'charge',     emoji: '⚔️', label: 'いざ！' },
  { id: 'splendid',   emoji: '🎉', label: 'お見事' },
  { id: 'thanks',     emoji: '🙏', label: 'かたじけない' },
  { id: 'hmm',        emoji: '😣', label: 'むむっ…' },
  { id: 'greeting',   emoji: '🙇', label: 'よろしく頼む' },
  { id: 'deal',       emoji: '🤝', label: '商談成立' },
  { id: 'appare',     emoji: '😄', label: 'あっぱれ' },
  { id: 'surrender',  emoji: '🏳️', label: '降参じゃ' },
];

export const STAMP_BY_ID: Record<string, StampDef> =
  Object.fromEntries(STAMPS.map((s) => [s.id, s]));
