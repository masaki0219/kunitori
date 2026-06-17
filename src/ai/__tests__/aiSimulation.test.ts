import { runAISetupTurn, runAITurn, setAIStepDelayScale } from '../aiPlayer';
import { useGameStore } from '../../store/gameStore';

describe('full AI game simulation', () => {
  beforeAll(() => setAIStepDelayScale(0));
  afterAll(() => setAIStepDelayScale(1));

  it('plays a 4-player all-AI game to completion without crashing or hanging', async () => {
    useGameStore.getState().startGame({
      players: [
        { name: 'AI1', isAI: true },
        { name: 'AI2', isAI: true },
        { name: 'AI3', isAI: true },
        { name: 'AI4', isAI: true },
      ],
    });

    const SAFETY_LIMIT = 3000;
    let iterations = 0;

    while (useGameStore.getState().phase === 'setupPlacement' && iterations < SAFETY_LIMIT) {
      await runAISetupTurn();
      iterations++;
    }
    expect(iterations).toBeLessThan(SAFETY_LIMIT);
    expect(useGameStore.getState().phase).toBe('roll');

    let turns = 0;
    while (useGameStore.getState().winner === null && turns < SAFETY_LIMIT) {
      await runAITurn();
      turns++;
    }

    expect(turns).toBeLessThan(SAFETY_LIMIT);
    expect(useGameStore.getState().winner).not.toBeNull();
    expect(useGameStore.getState().phase).toBe('gameOver');
  }, 60000);
});
