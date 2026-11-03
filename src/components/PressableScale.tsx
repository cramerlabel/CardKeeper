import { useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Extra style applied only while pressed (e.g. a dimmed background). */
  pressedStyle?: StyleProp<ViewStyle>;
  pressedScale?: number;
}

/** Pressable that springs down slightly while held, driven natively for smoothness. */
export function PressableScale({
  children,
  style,
  pressedStyle,
  pressedScale = 0.96,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableScaleProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const [pressed, setPressed] = useState(false);

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, speed: 40, bounciness: 6, useNativeDriver: true }).start();

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        if (!disabled) animateTo(pressedScale);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        animateTo(1);
        onPressOut?.(e);
      }}
      style={[style, pressed && pressedStyle, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
