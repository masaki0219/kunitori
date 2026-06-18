import { useGameStore } from '../../store/gameStore';

// netStore は roomCode/ids を動的 import() しているが、jest(CJS) 環境では
// --experimental-vm-modules が無いと dynamic import が使えないため、ここで静的にモックする。
jest.mock('../roomCode', () => ({
  generateRoomCode: jest.fn(() => 'TEST01'),
  normalizeRoomCode: jest.fn((s: string) => s.trim().toUpperCase()),
}));

jest.mock('../firebaseTransport', () => ({
  createFirebaseTransport: jest.fn(() => {
    const handlersRef: { current: any } = { current: null };
    return {
      __handlersRef: handlersRef,
      join: jest.fn(async (_room: string, _self: any, h: any) => {
        handlersRef.current = h;
      }),
      send: jest.fn(async () => {}),
      leave: jest.fn(async () => {}),
    };
  }),
}));

import { createFirebaseTransport } from '../firebaseTransport';
import { useNetStore } from '../netStore';

describe('useNetStore host presence handling', () => {
  beforeEach(() => {
    useGameStore.setState({ screen: 'lobby' } as any);
    useNetStore.setState({
      mode: 'local', role: null, mySeat: null, roomCode: null,
      status: 'idle', members: [], _transport: null, _rev: 0,
      _seenMsgIds: new Set(), _unsubscribeStore: null,
    } as any);
    (createFirebaseTransport as jest.Mock).mockClear();
  });

  test('assigns a new seat to a previously-unseen pending guest while in lobby', async () => {
    await useNetStore.getState().hostCreateRoom('Host');
    const transport = (createFirebaseTransport as jest.Mock).mock.results[0].value;
    const handlers = transport.__handlersRef.current;

    handlers.onPresenceChange({
      'seat-0': { seat: 0, name: 'Host', role: 'host' },
      'pending-xyz': { name: 'Guest1', role: 'guest' },
    });

    const members = useNetStore.getState().members;
    expect(members).toHaveLength(2);
    expect(members[0]).toMatchObject({ seat: 0, role: 'host', online: true });
    expect(members[1]).toMatchObject({ seat: 1, name: 'Guest1', role: 'guest', isAI: false, online: true });
  });

  test('does not reassign an already-assigned guest on repeated presence events', async () => {
    await useNetStore.getState().hostCreateRoom('Host');
    const transport = (createFirebaseTransport as jest.Mock).mock.results[0].value;
    const handlers = transport.__handlersRef.current;
    const present = {
      'seat-0': { seat: 0, name: 'Host', role: 'host' },
      'pending-xyz': { name: 'Guest1', role: 'guest' },
    };

    handlers.onPresenceChange(present);
    handlers.onPresenceChange(present);
    handlers.onPresenceChange(present);

    expect(useNetStore.getState().members).toHaveLength(2);
  });

  test('marks a guest offline when their presence key disappears, without dropping their seat', async () => {
    await useNetStore.getState().hostCreateRoom('Host');
    const transport = (createFirebaseTransport as jest.Mock).mock.results[0].value;
    const handlers = transport.__handlersRef.current;

    handlers.onPresenceChange({
      'seat-0': { seat: 0, name: 'Host', role: 'host' },
      'pending-xyz': { name: 'Guest1', role: 'guest' },
    });
    handlers.onPresenceChange({
      'seat-0': { seat: 0, name: 'Host', role: 'host' },
    });

    const members = useNetStore.getState().members;
    expect(members).toHaveLength(2);
    expect(members[1]).toMatchObject({ seat: 1, name: 'Guest1', online: false });
  });

  test('does not assign new seats once the game has started (screen !== lobby)', async () => {
    await useNetStore.getState().hostCreateRoom('Host');
    const transport = (createFirebaseTransport as jest.Mock).mock.results[0].value;
    const handlers = transport.__handlersRef.current;

    useGameStore.setState({ screen: 'game' } as any);
    handlers.onPresenceChange({
      'seat-0': { seat: 0, name: 'Host', role: 'host' },
      'pending-xyz': { name: 'Guest1', role: 'guest' },
    });

    expect(useNetStore.getState().members).toHaveLength(1);
  });
});
