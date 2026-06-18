const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateRoomCode(len = 6): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
