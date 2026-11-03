import { act, create } from 'react-test-renderer';

import { Button } from './Button';
import { ErrorFallback } from './ErrorFallback';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: () => null }));
jest.mock('@/utils/haptics', () => ({ haptics: { tap: jest.fn() } }));

describe('ErrorFallback', () => {
  it('offers retry and reset actions', () => {
    const onRetry = jest.fn();
    const onReset = jest.fn();
    let renderer!: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <ErrorFallback error={new Error('boom')} onRetry={onRetry} onReset={onReset} />,
      );
    });

    const [retry, reset] = renderer.root.findAllByType(Button);
    act(() => retry.props.onPress());
    act(() => reset.props.onPress());
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
