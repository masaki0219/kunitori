import React from 'react';
import { act, create } from 'react-test-renderer';
import TradeModal from '../TradeModal';
import { emptyResources } from '../../../game/resources';
import { Player } from '../../../game/types';

function makePlayer(id: number, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: `P${id}`,
    isAI: false,
    color: '#000',
    resources: emptyResources(),
    cards: [],
    cardsBoughtThisTurn: [],
    playedWarlords: 0,
    hasPlayedCardThisTurn: false,
    piecesLeft: { road: 15, fort: 5, castle: 4 },
    ...overrides,
  };
}

describe('TradeModal render (crash diagnosis)', () => {
  it('renders without throwing given a normal player with full resources', () => {
    const currentPlayer = makePlayer(0, {
      resources: { timber: 5, stone: 3, rice: 2, horse: 1, iron: 0 },
    });
    const otherPlayers = [makePlayer(1), makePlayer(2, { isAI: true })];

    let tree: ReturnType<typeof create> | undefined;
    expect(() => {
      act(() => {
        tree = create(
          <TradeModal
            currentPlayer={currentPlayer}
            otherPlayers={otherPlayers}
            onBankTrade={() => {}}
            onProposeTrade={() => {}}
            onClose={() => {}}
          />
        );
      });
    }).not.toThrow();

    expect(tree).toBeDefined();
  });

  it('renders without throwing when otherPlayers is empty (no other seats)', () => {
    const currentPlayer = makePlayer(0);
    expect(() => {
      act(() => {
        create(
          <TradeModal
            currentPlayer={currentPlayer}
            otherPlayers={[]}
            onBankTrade={() => {}}
            onProposeTrade={() => {}}
            onClose={() => {}}
          />
        );
      });
    }).not.toThrow();
  });

  it('does not throw when currentPlayer.resources is missing (returns null per guard)', () => {
    const currentPlayer = { ...makePlayer(0), resources: undefined as any };
    expect(() => {
      act(() => {
        create(
          <TradeModal
            currentPlayer={currentPlayer}
            otherPlayers={[makePlayer(1)]}
            onBankTrade={() => {}}
            onProposeTrade={() => {}}
            onClose={() => {}}
          />
        );
      });
    }).not.toThrow();
  });
});
