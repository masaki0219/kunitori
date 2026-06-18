import { SnapshotMessageSchema } from '../messages';

test('SnapshotMessageSchema preserves full player fields, not just id', () => {
  const payload = {
    rev: 1,
    state: {
      screen: 'game',
      phase: 'setupPlacement',
      currentPlayer: 0,
      players: [
        { id: 0, name: 'Host', isAI: false, cards: [], resources: { timber: 0, stone: 0, rice: 0, horse: 0, iron: 0 } },
        { id: 1, name: 'Guest', isAI: false, cards: [], resources: { timber: 0, stone: 0, rice: 0, horse: 0, iron: 0 } },
      ],
    },
  };
  const parsed = SnapshotMessageSchema.safeParse(payload);
  expect(parsed.success).toBe(true);
  if (!parsed.success) return;
  expect((parsed.data.state as any).players[0]).toMatchObject({ id: 0, name: 'Host', cards: [] });
  expect((parsed.data.state as any).players[1].resources).toEqual({ timber: 0, stone: 0, rice: 0, horse: 0, iron: 0 });
});
