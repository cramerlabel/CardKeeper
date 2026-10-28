import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing } from '@/theme';

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Felt background, safe-area padding, and content centered to a max width. */
export function ScreenContainer({ children, scroll = false, style }: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const { maxContentWidth, sizeClass } = useResponsive();
  const padding = sizeClass === 'compact' ? spacing.lg : spacing.xl;

  const inner = [styles.inner, { maxWidth: maxContentWidth, padding }, style];

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={inner}>{children}</View>
        </ScrollView>
      ) : (
        <View style={inner}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.felt,
    alignItems: 'center',
  },
  scroll: {
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
  },
});
