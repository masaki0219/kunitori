import React from 'react';
import { act, create } from 'react-test-renderer';
import TradeModal from '../TradeModal';
import { BANK_TRADE_RATE } from '../../../config/rules';
import { emptyResources } from '../../../game/resources';
import { Player, ResourceType } from '../../../game/types';

const DEFAULT_RATES: Record<ResourceType, number> = {
  timber: BANK_TRADE_RATE, stone: BANK_TRADE_RATE, rice: BANK_TRADE_RATE, horse: BANK_TRADE_RATE, iron: BANK_TRADE_RATE,
};

function makePlayer(id: number, overrides: Partial<Player> = {}): Player {
  return {
    id,
    name: `P${id}`,
    isAI: false,
    color: '#000',
    daimyo: 'toyotomi',
    resources: emptyResources(),
    vassals: [],
    raids: 0,
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
            rates={DEFAULT_RATES}
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
            rates={DEFAULT_RATES}
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
            rates={DEFAULT_RATES}
            onBankTrade={() => {}}
            onProposeTrade={() => {}}
            onClose={() => {}}
          />
        );
      });
    }).not.toThrow();
  });
});
