import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Text, type TextInputProps } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import CribbageSetupScreen from '@/app/cribbage/setup';
import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { DealerChips } from '@/features/setup/DealerChips';
import { NameField } from '@/features/setup/NameField';
import { CRIBBAGE_NAMES_STORAGE_KEY } from '@/features/setup/playerNames';
import { useCribbageStore } from '@/games/cribbage/store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
jest.mock('@/utils/haptics', () => ({ haptics: { tap: jest.fn() } }));

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockOpenRules = jest.fn();
jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    back: () => mockBack(),
  },
}));
jest.mock('@/features/rules/openRules', () => ({
  openRules: (id: string) => mockOpenRules(id),
}));

const flush = () => act(async () => {});

async function render(): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<CribbageSetupScreen />);
  });
  await flush();
  return renderer;
}

const nameFields = (r: ReactTestRenderer) => r.root.findAllByType(NameField);
const startButton = (r: ReactTestRenderer) =>
  r.root.findAllByType(Button).find((b) => b.props.label === 'Start game')!;
const [PLAYERS, LENGTH] = [0, 1];
const segmented = (r: ReactTestRenderer, index: number) =>
  r.root.findAllByType(SegmentedControl)[index];

function type(r: ReactTestRenderer, index: number, text: string) {
  act(() => nameFields(r)[index].props.onChangeText(text));
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useCribbageStore.getState().clear();
  await useCribbageStore.persist.rehydrate();
});

describe('CribbageSetupScreen', () => {
  it('starts a 2-player 121 game with the chosen dealer and goes to the board', async () => {
    const r = await render();
    type(r, 0, ' Ann ');
    type(r, 1, 'Bob');
    act(() => r.root.findByType(DealerChips).props.onChange(1));

    expect(startButton(r).props.disabled).toBe(false);
    act(() => startButton(r).props.onPress());

    const game = useCribbageStore.getState().currentGame!;
    expect(game).toMatchObject({
      players: ['Ann', 'Bob'],
      target: 121,
      firstDealer: 1,
      deal: 1,
      status: 'inProgress',
      events: [],
    });
    expect(mockReplace).toHaveBeenCalledWith('/cribbage/board');
  });

  it('fills blank names with defaults and resolves "Random" when starting', async () => {
    const random = jest.spyOn(Math, 'random').mockReturnValue(0.99);
    try {
      const r = await render();
      act(() => segmented(r, PLAYERS).props.onChange(3));
      act(() => segmented(r, LENGTH).props.onChange(61));
      expect(random).not.toHaveBeenCalled();
      act(() => startButton(r).props.onPress());
    } finally {
      random.mockRestore();
    }

    expect(useCribbageStore.getState().currentGame).toMatchObject({
      players: ['Player 1', 'Player 2', 'Player 3'],
      target: 61,
      firstDealer: 2,
    });
  });

  it('blocks Start with inline errors for duplicate names', async () => {
    const r = await render();
    type(r, 0, 'Sam');
    type(r, 1, ' sAM ');

    expect(nameFields(r)[1].props.error).toBe('Players must have different names.');
    expect(startButton(r).props.disabled).toBe(true);
    act(() => startButton(r).props.onPress());
    expect(useCribbageStore.getState().currentGame).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('keeps typed text when switching between 2 and 3 players', async () => {
    const r = await render();
    expect(nameFields(r)).toHaveLength(2);
    act(() => segmented(r, PLAYERS).props.onChange(3));
    expect(nameFields(r)).toHaveLength(3);
    type(r, 2, 'Cy');
    type(r, 0, 'Ann');

    act(() => segmented(r, PLAYERS).props.onChange(2));
    expect(nameFields(r)).toHaveLength(2);
    expect(nameFields(r)[0].props.value).toBe('Ann');

    act(() => segmented(r, PLAYERS).props.onChange(3));
    expect(nameFields(r).map((f) => f.props.value)).toEqual(['Ann', '', 'Cy']);
  });

  it('resets a third-player dealer choice when dropping to 2 players', async () => {
    const r = await render();
    act(() => segmented(r, PLAYERS).props.onChange(3));
    act(() => r.root.findByType(DealerChips).props.onChange(2));
    expect(r.root.findByType(DealerChips).props.value).toBe(2);

    act(() => segmented(r, PLAYERS).props.onChange(2));
    expect(r.root.findByType(DealerChips).props.value).toBe('random');
  });

  it('asks before replacing a saved game and only replaces on confirm', async () => {
    useCribbageStore.getState().startGame({ names: ['Old', 'Game'], target: 121, firstDealer: 0 });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const r = await render();
    type(r, 0, 'New');
    act(() => startButton(r).props.onPress());

    expect(alert).toHaveBeenCalledTimes(1);
    expect(useCribbageStore.getState().currentGame?.players).toEqual(['Old', 'Game']);
    expect(mockReplace).not.toHaveBeenCalled();

    const buttons = alert.mock.calls[0][2]!;
    act(() => buttons.find((b) => b.text === 'Start new game')!.onPress!());
    expect(useCribbageStore.getState().currentGame?.players).toEqual(['New', 'Player 2']);
    expect(mockReplace).toHaveBeenCalledWith('/cribbage/board');
    alert.mockRestore();
  });

  it('remembers the last names and prefills them, including the player count', async () => {
    const r = await render();
    act(() => segmented(r, PLAYERS).props.onChange(3));
    type(r, 0, ' Ann ');
    type(r, 2, 'Cy');
    act(() => startButton(r).props.onPress());
    await flush();

    expect(JSON.parse((await AsyncStorage.getItem(CRIBBAGE_NAMES_STORAGE_KEY))!)).toEqual([
      'Ann',
      '',
      'Cy',
    ]);

    const again = await render();
    expect(nameFields(again).map((f: { props: TextInputProps }) => f.props.value)).toEqual([
      'Ann',
      '',
      'Cy',
    ]);
    expect(segmented(again, PLAYERS).props.value).toBe(3);
  });

  it('does not overwrite what the user typed with a late prefill', async () => {
    await AsyncStorage.setItem(CRIBBAGE_NAMES_STORAGE_KEY, JSON.stringify(['Saved', 'Names']));
    let r!: ReactTestRenderer;
    act(() => {
      r = create(<CribbageSetupScreen />);
    });
    type(r, 0, 'Typed');
    await flush();
    expect(nameFields(r)[0].props.value).toBe('Typed');
    expect(nameFields(r)[1].props.value).toBe('');
  });

  it('ignores unreadable saved names', async () => {
    await AsyncStorage.setItem(CRIBBAGE_NAMES_STORAGE_KEY, '{not json');
    const r = await render();
    expect(nameFields(r).map((f) => f.props.value)).toEqual(['', '']);
  });

  it('opens the cribbage rules and goes back', async () => {
    const r = await render();
    const buttons = r.root.findAllByType(Button);
    act(() => buttons.find((b) => b.props.label === 'How to play')!.props.onPress());
    act(() => buttons.find((b) => b.props.label === 'Back')!.props.onPress());
    expect(mockOpenRules).toHaveBeenCalledWith('cribbage');
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('explains the skunk line for the chosen game length', async () => {
    const r = await render();
    const text = () =>
      r.root
        .findAllByType(Text)
        .map((n) => n.props.children)
        .flat()
        .join('|');
    expect(text()).toContain('double skunk under 61');
    act(() => segmented(r, LENGTH).props.onChange(61));
    expect(text()).toContain('no double skunk');
  });
});
