import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import CribbageScoreScreen from '@/app/cribbage/score';
import { Button } from '@/components/Button';
import { Keypad } from '@/features/handEntry/Keypad';
import { ERROR_CRIB_DEALER } from '@/games/cribbage/engine';
import { useCribbageStore } from '@/games/cribbage/store';

import { KindSelector } from './KindSelector';
import { PlayerChips } from './PlayerChips';
import { PointsReadout } from './PointsReadout';
import { QuickPoints } from './QuickPoints';
import { describeDropped } from './scoreEntry';

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

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockRedirect = jest.fn();
const mockDisablePrevention = jest.fn();
let mockParams: Record<string, string | undefined> = {};
let mockPrevent: {
  active: boolean;
  callback?: (options: { repeat: () => void }) => void;
} = { active: false };
jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => mockCanGoBack(),
  },
  Redirect: ({ href }: { href: string }) => {
    mockRedirect(href);
    return null;
  },
  useLocalSearchParams: () => mockParams,
  usePreventRemove: (active: boolean, callback: (options: { repeat: () => void }) => void) => {
    mockPrevent = { active, callback };
    return mockDisablePrevention;
  },
}));

const flush = () => act(async () => {});

async function render(): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<CribbageScoreScreen />);
  });
  await flush();
  return renderer;
}

const store = () => useCribbageStore.getState();
const events = () => store().currentGame!.events;
const button = (r: ReactTestRenderer, label: string) =>
  r.root.findAllByType(Button).find((b) => b.props.label === label)!;
const press = (r: ReactTestRenderer, label: string) => act(() => button(r, label).props.onPress());
const quick = (r: ReactTestRenderer, points: number) =>
  act(() => r.root.findByType(QuickPoints).props.onSelect(points));
const kind = (r: ReactTestRenderer, value: string) =>
  act(() => r.root.findByType(KindSelector).props.onChange(value));
const player = (r: ReactTestRenderer, value: number) =>
  act(() => r.root.findByType(PlayerChips).props.onSelect(value));
const message = (r: ReactTestRenderer) => r.root.findByType(PointsReadout).props.message;
const typed = (r: ReactTestRenderer) => r.root.findByType(PointsReadout).props.pointsText;

function startGame(names = ['Ann', 'Bob'], firstDealer: 0 | 1 | 2 = 0, target: 121 | 61 = 121) {
  store().startGame({ names, target, firstDealer });
}

function add(player: 0 | 1 | 2, kind: 'pegging' | 'hand' | 'crib' | 'heels' | 'other', points = 2) {
  const result = store().addScore({ player, kind, points });
  if (!result.ok) throw new Error(result.errors.join(' '));
}

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  mockPrevent = { active: false };
  mockCanGoBack.mockReturnValue(true);
  await AsyncStorage.clear();
  store().clear();
  await useCribbageStore.persist.rehydrate();
});

describe('CribbageScoreScreen guards', () => {
  it('redirects home when there is no game', async () => {
    await render();
    expect(mockRedirect).toHaveBeenCalledWith('/');
  });

  it('redirects to the board when the event does not exist', async () => {
    startGame();
    mockParams = { eventId: 'nope' };
    await render();
    expect(mockRedirect).toHaveBeenCalledWith('/cribbage/board');
  });

  it('does not allow adding to a finished game', async () => {
    startGame();
    add(0, 'hand', 5);
    store().finishGame();
    await render();
    expect(mockRedirect).toHaveBeenCalledWith('/cribbage/board');
  });

  it('closes via the board when there is nowhere to go back to', async () => {
    startGame();
    mockCanGoBack.mockReturnValue(false);
    const r = await render();
    quick(r, 4);
    press(r, 'Save');
    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/cribbage/board');
  });
});

describe('CribbageScoreScreen add mode', () => {
  it('starts with the player left of the dealer and nothing entered', async () => {
    startGame(['Ann', 'Bob', 'Cy'], 1);
    const r = await render();
    expect(r.root.findByType(PlayerChips).props).toMatchObject({
      selected: 2,
      dealer: 1,
      totals: [0, 0, 0],
      names: ['Ann', 'Bob', 'Cy'],
    });
    expect(r.root.findByType(KindSelector).props.value).toBe('pegging');
    expect(message(r)).toMatchObject({ tone: 'neutral', lines: ['Enter points for Cy'] });
    expect(button(r, 'Save').props.disabled).toBe(true);
    expect(button(r, 'Save & add another').props.disabled).toBe(true);
  });

  it('preselects the player from the route', async () => {
    startGame(['Ann', 'Bob', 'Cy']);
    mockParams = { player: '2' };
    const r = await render();
    expect(r.root.findByType(PlayerChips).props.selected).toBe(2);
  });

  it('saves points typed on the keypad to the current deal and closes', async () => {
    startGame();
    store().nextDeal();
    const r = await render();
    const keypad = () => r.root.findByType(Keypad).props;
    act(() => keypad().onDigit('1'));
    act(() => keypad().onDigit('2'));
    expect(typed(r)).toBe('12');
    act(() => keypad().onDigit('9'));
    expect(typed(r)).toBe('9');
    act(() => keypad().onClear());
    act(() => keypad().onDigit('1'));
    act(() => keypad().onDigit('4'));
    act(() => keypad().onBackspace());
    expect(typed(r)).toBe('1');
    act(() => keypad().onDigit('2'));
    kind(r, 'hand');
    expect(message(r)).toMatchObject({ tone: 'ok', lines: ['Ann: 0 → 12'] });

    press(r, 'Save');

    expect(events()).toMatchObject([{ player: 0, kind: 'hand', points: 12, deal: 2 }]);
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockDisablePrevention).toHaveBeenCalled();
  });

  it('shows the live preview and picks quick values', async () => {
    startGame();
    add(1, 'hand', 8);
    const r = await render();
    player(r, 1);
    quick(r, 6);
    expect(message(r)).toMatchObject({ tone: 'ok', lines: ['Bob: 8 → 14'] });
    expect(r.root.findByType(QuickPoints).props.selected).toBe(6);
  });

  it('announces a score that wins the game', async () => {
    startGame(['Ann', 'Bob'], 0, 61);
    add(1, 'hand', 29);
    add(1, 'hand', 29);
    const r = await render();
    quick(r, 3);
    expect(message(r)).toMatchObject({ lines: ['Bob: 58 → 61'], notes: ['Wins the game!'] });
  });

  it('sets heels to 2 points for the dealer and locks the keypad', async () => {
    startGame(['Ann', 'Bob'], 1);
    const r = await render();
    kind(r, 'heels');
    expect(typed(r)).toBe('2');
    expect(r.root.findByType(PlayerChips).props.selected).toBe(1);
    expect(r.root.findByType(Keypad).props.disabled).toBe(true);
    expect(r.root.findAllByType(QuickPoints)).toHaveLength(0);
    press(r, 'Save');
    expect(events()).toMatchObject([{ player: 1, kind: 'heels', points: 2 }]);
  });

  it('moves the crib to the dealer and explains it when someone else is chosen', async () => {
    startGame(['Ann', 'Bob'], 1);
    const r = await render();
    kind(r, 'crib');
    expect(r.root.findByType(PlayerChips).props.selected).toBe(1);
    quick(r, 8);
    expect(message(r).tone).toBe('ok');

    player(r, 0);
    expect(message(r)).toMatchObject({ tone: 'error', lines: [ERROR_CRIB_DEALER] });
    expect(button(r, 'Save').props.disabled).toBe(true);
    press(r, 'Save');
    expect(events()).toEqual([]);
  });

  it('adds another score after saving, keeping the screen open with fresh totals', async () => {
    startGame();
    const r = await render();
    quick(r, 6);
    kind(r, 'hand');
    press(r, 'Save & add another');

    expect(events()).toMatchObject([{ player: 1, kind: 'hand', points: 6 }]);
    expect(mockBack).not.toHaveBeenCalled();
    expect(r.root.findByType(PlayerChips).props.totals).toEqual([0, 6]);
    expect(r.root.findByType(KindSelector).props.value).toBe('pegging');
    expect(typed(r)).toBe('');
    expect(message(r)).toMatchObject({ lines: ['Added Bob +6 (Hand)'] });
    expect(mockPrevent.active).toBe(false);

    player(r, 0);
    quick(r, 2);
    expect(message(r)).toMatchObject({ lines: ['Ann: 0 → 2'] });
    press(r, 'Save & add another');
    expect(events()).toHaveLength(2);
  });

  it('closes after a score that wins even with "Save & add another"', async () => {
    startGame(['Ann', 'Bob'], 0, 61);
    add(1, 'hand', 29);
    add(1, 'hand', 29);
    const r = await render();
    quick(r, 3);
    press(r, 'Save & add another');
    expect(store().currentGame?.status).toBe('finished');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('shows store errors inline and stays open', async () => {
    startGame();
    add(0, 'hand', 5);
    const r = await render();
    quick(r, 4);
    store().finishGame();
    press(r, 'Save');
    expect(message(r)).toMatchObject({ tone: 'error', lines: ['The game is already over.'] });
    expect(mockBack).not.toHaveBeenCalled();
    quick(r, 6);
    expect(message(r).tone).toBe('ok');
  });
});

describe('CribbageScoreScreen unsaved changes', () => {
  it('only guards leaving once something has changed', async () => {
    startGame();
    mockParams = { player: '0' };
    const r = await render();
    expect(mockPrevent.active).toBe(false);
    quick(r, 4);
    expect(mockPrevent.active).toBe(true);
    quick(r, 4);
    expect(mockPrevent.active).toBe(true);
    act(() => r.root.findByType(Keypad).props.onClear());
    expect(mockPrevent.active).toBe(false);
  });

  it('asks before discarding and lets the navigation continue on confirm', async () => {
    startGame();
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const r = await render();
    quick(r, 4);
    const repeat = jest.fn();
    act(() => mockPrevent.callback!({ repeat }));

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe('Discard changes?');
    const buttons = alert.mock.calls[0][2]!;
    expect(repeat).not.toHaveBeenCalled();
    act(() => buttons.find((b) => b.text === 'Discard')!.onPress!());
    expect(repeat).toHaveBeenCalledTimes(1);
    expect(mockPrevent.active).toBe(false);
    alert.mockRestore();
  });
});

describe('CribbageScoreScreen edit mode', () => {
  const editEvent = (index: number) => {
    mockParams = { eventId: events()[index].id };
  };

  it('loads the score, saves changes and closes without a confirmation', async () => {
    startGame();
    add(1, 'pegging', 4);
    add(0, 'hand', 8);
    editEvent(0);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const r = await render();

    expect(r.root.findByType(PlayerChips).props.selected).toBe(1);
    expect(typed(r)).toBe('4');
    expect(r.root.findAllByType(Button).map((b) => b.props.label)).toEqual([
      'Delete',
      'Save changes',
    ]);
    expect(mockPrevent.active).toBe(false);

    quick(r, 6);
    expect(message(r)).toMatchObject({ lines: ['Bob: 4 → 6'] });
    press(r, 'Save changes');

    expect(alert).not.toHaveBeenCalled();
    expect(events().map((e) => [e.player, e.kind, e.points])).toEqual([
      [1, 'pegging', 6],
      [0, 'hand', 8],
    ]);
    expect(mockBack).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('validates the edit against the deal of the score', async () => {
    startGame();
    add(0, 'crib', 6);
    editEvent(0);
    const r = await render();
    player(r, 1);
    expect(message(r)).toMatchObject({ tone: 'error', lines: [ERROR_CRIB_DEALER] });
    expect(button(r, 'Save changes').props.disabled).toBe(true);
  });

  it('warns before saving an edit that ends the game sooner and drops later scores', async () => {
    startGame(['Ann', 'Bob'], 0, 61);
    add(1, 'pegging', 4);
    add(0, 'hand', 29);
    add(1, 'hand', 29);
    add(0, 'hand', 20);
    add(1, 'hand', 20);
    expect(events()).toHaveLength(5);
    editEvent(1);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const r = await render();

    // Giving Ann's 29 to Bob puts him on 62 at score 3, so scores 4 and 5 would be removed.
    player(r, 1);
    expect(message(r)).toMatchObject({
      tone: 'ok',
      lines: ['Bob: 53 → 61'],
      notes: ['Wins the game!', describeDropped(2)],
    });
    press(r, 'Save changes');

    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe('Save changes?');
    expect(alert.mock.calls[0][1]).toBe(describeDropped(2));
    expect(events()).toHaveLength(5);
    expect(mockBack).not.toHaveBeenCalled();

    act(() => alert.mock.calls[0][2]!.find((b) => b.text === 'Save')!.onPress!());
    expect(events()).toHaveLength(3);
    expect(store().currentGame?.status).toBe('finished');
    expect(mockBack).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('deletes after confirmation', async () => {
    startGame();
    add(1, 'pegging', 4);
    add(0, 'hand', 8);
    editEvent(1);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const r = await render();

    press(r, 'Delete');
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0][0]).toBe('Delete score 2?');
    expect(alert.mock.calls[0][1]).toContain('Ann +8 (Hand)');
    expect(events()).toHaveLength(2);

    act(() => alert.mock.calls[0][2]!.find((b) => b.text === 'Delete')!.onPress!());
    expect(events().map((e) => e.points)).toEqual([4]);
    expect(mockBack).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('does not delete when the confirmation is cancelled', async () => {
    startGame();
    add(1, 'pegging', 4);
    editEvent(0);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const r = await render();
    press(r, 'Delete');
    act(() => alert.mock.calls[0][2]!.find((b) => b.text === 'Cancel')!.onPress?.());
    expect(events()).toHaveLength(1);
    expect(mockBack).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
