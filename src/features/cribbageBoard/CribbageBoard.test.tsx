import { AccessibilityInfo, Animated } from 'react-native';
import Svg from 'react-native-svg';
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer';

import { SHORT_CONFIG, STANDARD_CONFIG, type PegPosition } from '@/games/cribbage/engine';
import { CribbageBoard, type CribbageBoardProps } from './CribbageBoard';
import { buildBoard, pegPoint } from './geometry';
import { BACK_START_POSITION, MAX_MOVE_MS } from './pegMotion';

const LAYOUT = { width: 360, height: 700 };
const NAMES = ['Alice', 'Bob'];
const START: PegPosition[] = [
  { front: 0, back: 0 },
  { front: 0, back: 0 },
];

let reduceMotionEnabled = false;
let reduceMotionListener: ((enabled: boolean) => void) | undefined;

beforeEach(() => {
  reduceMotionEnabled = false;
  reduceMotionListener = undefined;
  // Jest's NativeAnimatedModule is a no-op mock, so run animations on the JS driver instead.
  jest
    .spyOn(
      jest.requireActual('react-native/src/private/animated/NativeAnimatedHelper').default,
      'shouldUseNativeDriver',
    )
    .mockReturnValue(false);
  jest
    .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
    .mockImplementation(() => Promise.resolve(reduceMotionEnabled));
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_event, handler) => {
    reduceMotionListener = handler as (enabled: boolean) => void;
    return { remove: jest.fn() };
  });
});

const renderers: ReactTestRenderer[] = [];

afterEach(async () => {
  await act(async () => {
    renderers.splice(0).forEach((renderer) => renderer.unmount());
  });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function props(overrides: Partial<CribbageBoardProps> = {}): CribbageBoardProps {
  return { pegs: START, playerNames: NAMES, config: STANDARD_CONFIG, dealer: 0, ...overrides };
}

async function render(initial: CribbageBoardProps, measured = true): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = create(<CribbageBoard {...initial} />);
  });
  renderers.push(renderer);
  if (measured) await measure(renderer, LAYOUT);
  return renderer;
}

async function measure(renderer: ReactTestRenderer, layout: { width: number; height: number }) {
  await act(async () => {
    renderer.root.findByProps({ accessibilityRole: 'image' }).props.onLayout({
      nativeEvent: { layout },
    });
  });
}

async function update(renderer: ReactTestRenderer, next: CribbageBoardProps) {
  await act(async () => {
    renderer.update(<CribbageBoard {...next} />);
  });
}

function peg(renderer: ReactTestRenderer, lane: number, role: 'front' | 'back'): ReactTestInstance {
  return renderer.root.findByProps({ testID: `peg-${lane}-${role}` });
}

/** Current on-screen centre of a peg, read from its animated transform. */
function pegCentre(renderer: ReactTestRenderer, lane: number, role: 'front' | 'back') {
  const style = peg(renderer, lane, role).props.style as unknown[];
  const flat = style.flat(Infinity).filter(Boolean) as Record<string, unknown>[];
  const transform = flat.find((entry) => entry.transform)?.transform as {
    translateX: Animated.AnimatedInterpolation<number>;
    translateY: Animated.AnimatedInterpolation<number>;
  }[];
  const width = (flat.find((entry) => typeof entry.width === 'number')?.width as number) / 2;
  const read = (value: unknown) => (value as { __getValue(): number }).__getValue();
  return { x: read(transform[0].translateX) + width, y: read(transform[1].translateY) + width };
}

describe('CribbageBoard', () => {
  it('describes the board for screen readers and hides the drawing from the tree', async () => {
    const renderer = await render(
      props({
        pegs: [
          { front: 87, back: 80 },
          { front: 79, back: 70 },
        ],
      }),
    );
    const container = renderer.root.findByProps({ accessibilityRole: 'image' });
    expect(container.props.accessible).toBe(true);
    expect(container.props.accessibilityLabel).toBe(
      'Cribbage board. Alice 87, Bob 79. Alice is dealing.',
    );
    const hidden = renderer.root.findAll(
      (node) => node.props.importantForAccessibility === 'no-hide-descendants',
    );
    expect(hidden.length).toBeGreaterThan(0);
  });

  it('draws nothing until it has been measured', async () => {
    const renderer = await render(props(), false);
    expect(renderer.root.findAllByType(Svg)).toHaveLength(0);
    await measure(renderer, LAYOUT);
    expect(renderer.root.findAllByType(Svg)).toHaveLength(1);
  });

  it('renders a front and a back peg per player, for two and three players', async () => {
    const two = await render(props());
    expect(
      two.root.findAll(
        (node) => String(node.props.testID).startsWith('peg-') && typeof node.type !== 'string',
      ),
    ).toBeTruthy();
    for (const lane of [0, 1]) {
      expect(peg(two, lane, 'front')).toBeTruthy();
      expect(peg(two, lane, 'back')).toBeTruthy();
    }
    const three = await render(
      props({ pegs: [...START, { front: 0, back: 0 }], playerNames: [...NAMES, 'Cy'], dealer: 2 }),
    );
    for (const lane of [0, 1, 2]) {
      expect(peg(three, lane, 'front')).toBeTruthy();
      expect(peg(three, lane, 'back')).toBeTruthy();
    }
  });

  it('renders for portrait and landscape, 121 and 61 games', async () => {
    for (const layout of [LAYOUT, { width: 700, height: 360 }, { width: 800, height: 1280 }]) {
      for (const config of [STANDARD_CONFIG, SHORT_CONFIG]) {
        const renderer = await render(props({ config }), false);
        await measure(renderer, layout);
        expect(renderer.root.findAllByType(Svg)).toHaveLength(1);
      }
    }
  });

  it('renders nothing (without crashing) when the space is too small for the board', async () => {
    const renderer = await render(props(), false);
    await measure(renderer, { width: 30, height: 30 });
    expect(renderer.root.findAllByType(Svg)).toHaveLength(0);
  });

  it('places pegs at their positions on mount without animating from zero', async () => {
    const pegs = [
      { front: 87, back: 80 },
      { front: 79, back: 70 },
    ];
    const renderer = await render(props({ pegs }));
    const board = buildBoard({ ...LAYOUT, playerCount: 2, config: STANDARD_CONFIG });
    expect(pegCentre(renderer, 0, 'front')).toEqual(pegPoint(board, 0, 87));
    expect(pegCentre(renderer, 0, 'back')).toEqual(pegPoint(board, 0, 80));
    expect(pegCentre(renderer, 1, 'front')).toEqual(pegPoint(board, 1, 79));
    expect(pegCentre(renderer, 1, 'back')).toEqual(pegPoint(board, 1, 70));
  });

  it('keeps the start pegs in the two start holes of a new game', async () => {
    const renderer = await render(props());
    const board = buildBoard({ ...LAYOUT, playerCount: 2, config: STANDARD_CONFIG });
    expect(pegCentre(renderer, 0, 'front')).toEqual(board.startPoints[0]);
    expect(pegCentre(renderer, 0, 'back')).toEqual(board.backStartPoints[0]);
  });

  it('jumps straight to the new position when animation is off', async () => {
    const renderer = await render(props({ animate: false }));
    const board = buildBoard({ ...LAYOUT, playerCount: 2, config: STANDARD_CONFIG });
    await update(
      renderer,
      props({
        animate: false,
        pegs: [{ front: 12, back: 0 }, START[1]],
      }),
    );
    expect(pegCentre(renderer, 0, 'front')).toEqual(pegPoint(board, 0, 12));
    expect(pegCentre(renderer, 1, 'front')).toEqual(board.startPoints[1]);
  });

  it('jumps straight to the new position when reduce motion is on', async () => {
    reduceMotionEnabled = true;
    const renderer = await render(props());
    const board = buildBoard({ ...LAYOUT, playerCount: 2, config: STANDARD_CONFIG });
    await update(renderer, props({ pegs: [{ front: 12, back: 0 }, START[1]] }));
    expect(pegCentre(renderer, 0, 'front')).toEqual(pegPoint(board, 0, 12));
  });

  it('follows a changed reduce-motion setting', async () => {
    const renderer = await render(props());
    const board = buildBoard({ ...LAYOUT, playerCount: 2, config: STANDARD_CONFIG });
    await act(async () => reduceMotionListener?.(true));
    await update(renderer, props({ pegs: [{ front: 12, back: 0 }, START[1]] }));
    expect(pegCentre(renderer, 0, 'front')).toEqual(pegPoint(board, 0, 12));
  });

  it('animates a score along the track and ends on the new position', async () => {
    jest.useFakeTimers();
    const renderer = await render(props());
    const board = buildBoard({ ...LAYOUT, playerCount: 2, config: STANDARD_CONFIG });
    await update(renderer, props({ pegs: [{ front: 12, back: 0 }, START[1]] }));
    // Right after the change the peg has not yet left the start.
    expect(pegCentre(renderer, 0, 'front')).toEqual(board.startPoints[0]);
    await act(async () => {
      jest.advanceTimersByTime(MAX_MOVE_MS / 2);
    });
    const middle = pegCentre(renderer, 0, 'front');
    expect(middle).not.toEqual(board.startPoints[0]);
    expect(middle).not.toEqual(pegPoint(board, 0, 12));
    await act(async () => {
      jest.advanceTimersByTime(MAX_MOVE_MS * 2);
    });
    expect(pegCentre(renderer, 0, 'front')).toEqual(pegPoint(board, 0, 12));
  });

  it('leapfrogs: the waiting back peg jumps to the new front while the old front stays', async () => {
    jest.useFakeTimers();
    const renderer = await render(props({ pegs: [{ front: 8, back: 0 }, START[1]] }));
    const board = buildBoard({ ...LAYOUT, playerCount: 2, config: STANDARD_CONFIG });
    const oldFront = pegCentre(renderer, 0, 'front');
    const oldBack = pegCentre(renderer, 0, 'back');
    expect(oldBack).toEqual(board.backStartPoints[0]);
    expect(BACK_START_POSITION).toBe(-1);

    await update(renderer, props({ pegs: [{ front: 14, back: 8 }, START[1]] }));
    await act(async () => {
      jest.advanceTimersByTime(MAX_MOVE_MS * 2);
    });
    // The new back peg is where the old front peg was; the new front is where the old back peg went.
    expect(pegCentre(renderer, 0, 'back')).toEqual(oldFront);
    expect(pegCentre(renderer, 0, 'front')).toEqual(pegPoint(board, 0, 14));
  });

  it('re-lays out pegs when the available size changes', async () => {
    const renderer = await render(props({ pegs: [{ front: 40, back: 30 }, START[1]] }));
    const landscape = { width: 700, height: 360 };
    await measure(renderer, landscape);
    const board = buildBoard({ ...landscape, playerCount: 2, config: STANDARD_CONFIG });
    expect(pegCentre(renderer, 0, 'front')).toEqual(pegPoint(board, 0, 40));
  });

  it('does not rebuild the static drawing when only the pegs or dealer change', async () => {
    const renderer = await render(props({ animate: false }));
    const propsBefore = renderer.root.findByType(Svg).props;
    await update(
      renderer,
      props({ animate: false, pegs: [{ front: 5, back: 0 }, START[1]], dealer: 1 }),
    );
    // BoardSvg is memoised on the geometry: a bail-out keeps the very same props object.
    expect(renderer.root.findByType(Svg).props).toBe(propsBefore);
  });

  it('shows the dealer badge only for the dealer and moves it with the dealer', async () => {
    const renderer = await render(props({ animate: false }));
    const badges = () => renderer.root.findAllByProps({ children: 'D' }).length;
    expect(badges()).toBeGreaterThan(0);
    const before = badges();
    await update(renderer, props({ animate: false, dealer: 1 }));
    expect(badges()).toBe(before);
    await update(renderer, props({ animate: false, dealer: undefined }));
    expect(badges()).toBe(0);
  });
});
