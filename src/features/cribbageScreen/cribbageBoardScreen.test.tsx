import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo, Alert, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import CribbageBoardScreen from '@/app/cribbage/board';
import { Button } from '@/components/Button';
import { CribbageBoard } from '@/features/cribbageBoard/CribbageBoard';
import { CribbageHistory } from '@/features/cribbageHistory/CribbageHistory';
import { CribbagePlayerPanel } from '@/features/cribbagePanel/CribbagePlayerPanel';
import { GameMenu } from '@/features/scoreboard/GameMenu';
import { useCribbageStore } from '@/games/cribbage/store';
import { STORAGE_KEY } from '@/games/cribbage/store/persistence';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('@/utils/haptics', () => ({
  haptics: { tap: jest.fn(), success: jest.fn(), warning: jest.fn() },
}));

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockRedirect = jest.fn();
const mockOpenRules = jest.fn();
jest.mock('expo-router', () => {
  const { useEffect: useMockEffect } = jest.requireActual('react');
  return {
    router: {
      push: (...args: unknown[]) => mockPush(...args),
      replace: (...args: unknown[]) => mockReplace(...args),
      back: () => mockBack(),
      canGoBack: () => mockCanGoBack(),
    },
    Redirect: ({ href }: { href: string }) => {
      mockRedirect(href);
      return null;
    },
    useFocusEffect: (callback: () => void) => useMockEffect(callback, [callback]),
  };
});
jest.mock('@/features/rules/openRules', () => ({
  openRules: (id: string) => mockOpenRules(id),
}));

const flush = () => act(async () => {});
const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const renderers: ReactTestRenderer[] = [];

async function render(): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<CribbageBoardScreen />);
  });
  renderers.push(renderer);
  await flush();
  return renderer;
}

const store = () => useCribbageStore.getState();
const game = () => store().currentGame!;
const button = (r: ReactTestRenderer, label: string) =>
  r.root.findAllByType(Button).find((b) => b.props.label === label)!;
const press = (r: ReactTestRenderer, label: string) =>
  act(() => {
    button(r, label).props.onPress();
  });
const panels = (r: ReactTestRenderer) => r.root.findAllByType(CribbagePlayerPanel);
const menuAction = (r: ReactTestRenderer, key: string) =>
  r.root.findByType(GameMenu).props.actions.find((a: { key: string }) => a.key === key) as {
    onPress: () => void;
    disabled?: boolean;
  };
const runMenu = (r: ReactTestRenderer, key: string) =>
  act(() => {
    menuAction(r, key).onPress();
  });
const alertButtons = () =>
  (Alert.alert as jest.Mock).mock.calls.at(-1)![2] as { text: string; onPress?: () => void }[];
const confirm = (text: string) =>
  act(() => {
    alertButtons()
      .find((b) => b.text === text)!
      .onPress?.();
  });
const allText = (r: ReactTestRenderer) =>
  r.root.findAllByType(Text).map((node) => [node.props.children].flat().join(''));
const byLabel = (r: ReactTestRenderer, label: string) =>
  r.root.find((node) => node.props.accessibilityLabel === label && !!node.props.onPress);

function startGame(
  names = ['Ann', 'Bob', 'Cy'],
  firstDealer: 0 | 1 | 2 = 0,
  target: 121 | 61 = 121,
) {
  act(() => {
    store().startGame({ names, target, firstDealer });
  });
}

function add(
  player: 0 | 1 | 2,
  kind: 'pegging' | 'hand' | 'crib' | 'heels' | 'other',
  points = 2,
  deal?: number,
) {
  act(() => {
    const result = store().addScore({ player, kind, points, deal });
    if (!result.ok) throw new Error(result.errors.join(' '));
  });
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockCanGoBack.mockReturnValue(true);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.spyOn(AccessibilityInfo, 'announceForAccessibility').mockImplementation(() => {});
  await AsyncStorage.clear();
  store().clear();
  await useCribbageStore.persist.rehydrate();
});

afterEach(async () => {
  await act(async () => {
    renderers.splice(0).forEach((renderer) => renderer.unmount());
  });
  jest.restoreAllMocks();
});

describe('CribbageBoardScreen guards', () => {
  it('redirects home when there is no game', async () => {
    await render();
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('does not redirect for a game in progress', async () => {
    startGame();
    await render();
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to game-over once the game has finished', async () => {
    startGame();
    add(0, 'hand', 8);
    const r = await render();
    expect(mockReplace).not.toHaveBeenCalled();

    act(() => {
      store().finishGame();
    });
    expect(mockReplace).toHaveBeenCalledWith('/cribbage/game-over');
    expect(r.root).toBeDefined();
  });

  it('redirects to game-over when a score reaches the target while focused', async () => {
    startGame(['Ann', 'Bob']);
    for (let deal = 1; deal <= 4; deal++) add(0, 'hand', 29, deal);
    await render();
    act(() => {
      store().addScore({ player: 0, kind: 'hand', points: 10, deal: 5 });
    });
    expect(game().status).toBe('finished');
    expect(mockReplace).toHaveBeenCalledWith('/cribbage/game-over');
  });
});

describe('CribbageBoardScreen content', () => {
  it('shows a brand-new game: deal 1, nothing scored, pegs at the start', async () => {
    startGame(['Ann', 'Bob', 'Cy'], 1);
    const r = await render();

    expect(allText(r)).toContain('Deal 1 · first to 121');
    const board = r.root.findByType(CribbageBoard);
    expect(board.props).toMatchObject({
      playerNames: ['Ann', 'Bob', 'Cy'],
      dealer: 1,
      pegs: [
        { front: 0, back: 0 },
        { front: 0, back: 0 },
        { front: 0, back: 0 },
      ],
      config: { target: 121, skunkLine: 91, doubleSkunkLine: 61 },
    });
    expect(
      panels(r).map((p) => [p.props.name, p.props.total, p.props.dealer, p.props.leading]),
    ).toEqual([
      ['Ann', 0, false, false],
      ['Bob', 0, true, false],
      ['Cy', 0, false, false],
    ]);
    expect(r.root.findByType(CribbageHistory).props.sections).toEqual([
      expect.objectContaining({ deal: 1, dealerName: 'Bob', isCurrent: true, rows: [] }),
    ]);
  });

  it('uses the short-game config', async () => {
    startGame(['Ann', 'Bob'], 0, 61);
    const r = await render();
    expect(r.root.findByType(CribbageBoard).props.config).toMatchObject({
      target: 61,
      skunkLine: 31,
      doubleSkunkLine: null,
    });
    expect(allText(r)).toContain('Deal 1 · first to 61');
  });

  it('renders two panels for two players', async () => {
    startGame(['Ann', 'Bob']);
    const r = await render();
    expect(panels(r)).toHaveLength(2);
  });

  it('keys the board by game id so a new game does not animate from the old one', async () => {
    startGame();
    const r = await render();
    const first = r.root.findByType(CribbageBoard);
    add(0, 'hand', 8);
    expect(r.root.findByType(CribbageBoard)).toBe(first);

    const oldId = game().id;
    act(() => {
      startGame(['Ann', 'Bob', 'Cy']);
    });
    expect(game().id).not.toBe(oldId);
    expect(r.root.findByType(CribbageBoard)).not.toBe(first);
  });

  it('follows the store: totals, pegs, leader and history update', async () => {
    startGame();
    const r = await render();

    add(1, 'hand', 12);
    add(2, 'pegging', 3);

    expect(panels(r).map((p) => [p.props.total, p.props.leading])).toEqual([
      [0, false],
      [12, true],
      [3, false],
    ]);
    expect(r.root.findByType(CribbageBoard).props.pegs).toEqual([
      { front: 0, back: 0 },
      { front: 12, back: 0 },
      { front: 3, back: 0 },
    ]);
    const [section] = r.root.findByType(CribbageHistory).props.sections;
    expect(section.rows.map((row: { description: string }) => row.description)).toEqual([
      'Cy +3 (Pegging)',
      'Bob +12 (Hand)',
    ]);
  });

  it('highlights nobody when the lead is tied', async () => {
    startGame(['Ann', 'Bob']);
    add(0, 'hand', 6);
    add(1, 'hand', 6);
    const r = await render();
    expect(panels(r).map((p) => p.props.leading)).toEqual([false, false]);
  });
});

describe('CribbageBoardScreen navigation', () => {
  it('opens score entry for a player from their panel', async () => {
    startGame();
    const r = await render();
    act(() => panels(r)[2].props.onAddScore());
    expect(mockPush).toHaveBeenCalledWith('/cribbage/score?player=2');
  });

  it('opens score entry without a preselected player from "Add score"', async () => {
    startGame();
    const r = await render();
    press(r, 'Add score');
    expect(mockPush).toHaveBeenCalledWith('/cribbage/score');
  });

  it('opens a history row for editing', async () => {
    startGame();
    add(0, 'hand', 8);
    const r = await render();
    const id = game().events[0].id;
    act(() => r.root.findByType(CribbageHistory).props.onSelectScore(id));
    expect(mockPush).toHaveBeenCalledWith(`/cribbage/score?eventId=${id}`);
  });

  it('goes back from the chevron, or home when there is no history', async () => {
    startGame();
    const r = await render();
    const back = () => byLabel(r, 'Back to menu');

    act(() => {
      back().props.onPress();
    });
    expect(mockBack).toHaveBeenCalledTimes(1);

    mockCanGoBack.mockReturnValue(false);
    act(() => {
      back().props.onPress();
    });
    expect(mockReplace).toHaveBeenCalledWith('/');
  });
});

describe('CribbageBoardScreen next deal', () => {
  it('advances the dealer without asking when scores were recorded this deal', async () => {
    startGame(['Ann', 'Bob', 'Cy']);
    add(0, 'hand', 8);
    const r = await render();
    const pegsBefore = r.root.findByType(CribbageBoard).props.pegs;

    press(r, 'Next deal');

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(game().deal).toBe(2);
    expect(panels(r).map((p) => p.props.dealer)).toEqual([false, true, false]);
    expect(r.root.findByType(CribbageBoard).props.dealer).toBe(1);
    expect(r.root.findByType(CribbageBoard).props.pegs).toBe(pegsBefore);
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Deal 2. Bob is dealing.',
    );
    expect(allText(r)).toContain('Deal 2 · first to 121');
  });

  it('asks first when nothing was scored this deal', async () => {
    startGame();
    const r = await render();

    press(r, 'Next deal');
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(game().deal).toBe(1);

    confirm('Stay');
    expect(game().deal).toBe(1);

    confirm('Next deal');
    expect(game().deal).toBe(2);
  });

  it('asks again for the new, empty deal', async () => {
    startGame();
    add(0, 'hand', 8);
    const r = await render();
    press(r, 'Next deal');
    expect(game().deal).toBe(2);

    press(r, 'Next deal');
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(game().deal).toBe(2);
  });

  it('lists the empty current deal above earlier ones', async () => {
    startGame();
    add(0, 'hand', 8);
    const r = await render();
    press(r, 'Next deal');
    const sections = r.root.findByType(CribbageHistory).props.sections;
    expect(sections.map((s: { deal: number; rows: unknown[] }) => [s.deal, s.rows.length])).toEqual(
      [
        [2, 0],
        [1, 1],
      ],
    );
  });
});

describe('CribbageBoardScreen menu', () => {
  it('disables undo and end game before anything is scored', async () => {
    startGame();
    const r = await render();
    expect(menuAction(r, 'undo').disabled).toBe(true);
    expect(menuAction(r, 'end').disabled).toBe(true);
    expect(menuAction(r, 'abandon').disabled).toBeFalsy();
  });

  it('opens and closes the menu from the header button', async () => {
    startGame();
    const r = await render();
    expect(r.root.findByType(GameMenu).props.visible).toBe(false);
    act(() => {
      byLabel(r, 'Game menu').props.onPress();
    });
    expect(r.root.findByType(GameMenu).props.visible).toBe(true);
    act(() => r.root.findByType(GameMenu).props.onClose());
    expect(r.root.findByType(GameMenu).props.visible).toBe(false);
  });

  it('undoes the last score after confirming, without stepping the dealer back', async () => {
    startGame();
    add(0, 'hand', 8);
    add(1, 'pegging', 3);
    const r = await render();
    act(() => {
      store().nextDeal();
    });

    runMenu(r, 'undo');
    expect(Alert.alert).toHaveBeenLastCalledWith(
      'Undo last score?',
      expect.stringContaining('Bob +3 (Pegging)'),
      expect.any(Array),
    );
    expect(game().events).toHaveLength(2);

    confirm('Keep');
    expect(game().events).toHaveLength(2);

    confirm('Undo');
    expect(game().events.map((e) => e.points)).toEqual([8]);
    expect(game().deal).toBe(2);
    expect(panels(r).map((p) => p.props.total)).toEqual([8, 0, 0]);
  });

  it('ends the game early after confirming', async () => {
    startGame();
    add(0, 'hand', 8);
    const r = await render();

    runMenu(r, 'end');
    expect(game().status).toBe('inProgress');
    confirm('Keep playing');
    expect(game().status).toBe('inProgress');

    confirm('End game');
    expect(game().status).toBe('finished');
    expect(mockReplace).toHaveBeenCalledWith('/cribbage/game-over');
  });

  it('abandons the game after confirming and leaves the board', async () => {
    startGame();
    add(0, 'hand', 8);
    const r = await render();

    runMenu(r, 'abandon');
    confirm('Keep playing');
    expect(store().currentGame).not.toBeNull();

    confirm('Abandon');
    expect(store().currentGame).toBeNull();
    expect(store().history).toHaveLength(0);
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('opens the cribbage rules and goes back to the menu', async () => {
    startGame();
    const r = await render();
    runMenu(r, 'rules');
    expect(mockOpenRules).toHaveBeenCalledWith('cribbage');

    runMenu(r, 'home');
    expect(mockBack).toHaveBeenCalled();
  });
});

describe('CribbageBoardScreen persistence', () => {
  it('resumes a saved game with identical pegs after a restart', async () => {
    startGame(['Ann', 'Bob', 'Cy'], 2);
    add(0, 'hand', 8);
    add(1, 'pegging', 3);
    add(2, 'crib', 4);
    act(() => {
      store().nextDeal();
    });
    const before = await render();
    const pegsBefore = JSON.parse(JSON.stringify(before.root.findByType(CribbageBoard).props.pegs));
    await act(async () => {
      before.unmount();
    });
    renderers.splice(0);

    // Simulate an app restart: memory is lost but the persisted copy is loaded again.
    const saved = (await AsyncStorage.getItem(STORAGE_KEY))!;
    await act(async () => {
      useCribbageStore.setState({ currentGame: null }, false);
      await flushPromises();
      await AsyncStorage.setItem(STORAGE_KEY, saved);
      await useCribbageStore.persist.rehydrate();
    });
    expect(game().deal).toBe(2);

    const after = await render();
    expect(after.root.findByType(CribbageBoard).props.pegs).toEqual(pegsBefore);
    expect(after.root.findByType(CribbageBoard).props.dealer).toBe(0);
    expect(game().deal).toBe(2);
  });
});
