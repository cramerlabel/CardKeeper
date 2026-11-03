import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

import { useTextScale } from '@/features/scoreboard/useTextScale';

interface WinnerBannerProps {
  headline: string;
  subline: string;
  /** False for a tie: shows a handshake instead of a trophy. */
  hasChampion: boolean;
}

export function WinnerBanner({ headline, subline, hasChampion }: WinnerBannerProps) {
  const scale = useTextScale();
  const { isDense } = useResponsive();
  const [pop] = useState(() => new Animated.Value(0));

  useEffect(() => {
    haptics.success();
    Animated.spring(pop, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [pop]);

  const iconSize = isDense ? 30 : scale(72);
  const trophyStyle = {
    opacity: pop,
    transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
  };
  const textStyle = {
    opacity: pop.interpolate({
      inputRange: [0, 0.6, 1],
      outputRange: [0, 0, 1],
      easing: Easing.out(Easing.quad),
    }),
    transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  return (
    <View
      style={[styles.banner, isDense && styles.bannerDense]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={`${headline} ${subline}`}
    >
      <Animated.View
        style={[styles.badge, { width: iconSize * 1.7, height: iconSize * 1.7 }, trophyStyle]}
      >
        <MaterialCommunityIcons
          name={hasChampion ? 'trophy' : 'handshake'}
          size={iconSize}
          color={colors.gold}
        />
      </Animated.View>
      <Animated.View style={[styles.texts, isDense && styles.textsDense, textStyle]}>
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          style={[
            styles.headline,
            isDense && styles.left,
            isDense
              ? { fontSize: 26, lineHeight: 30 }
              : {
                  fontSize: scale(typography.title.fontSize + 4),
                  lineHeight: scale(typography.title.lineHeight + 6),
                },
          ]}
        >
          {headline}
        </Text>
        <Text
          numberOfLines={isDense ? 2 : undefined}
          style={[
            styles.subline,
            isDense && styles.left,
            { fontSize: isDense ? 14 : scale(typography.body.fontSize) },
          ]}
        >
          {subline}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', gap: spacing.md },
  badge: {
    borderRadius: radius.pill,
    backgroundColor: colors.feltDark,
    borderWidth: 2,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerDense: { flexDirection: 'row', gap: spacing.lg },
  textsDense: { flex: 1, alignItems: 'flex-start' },
  left: { textAlign: 'left' },
  texts: { alignItems: 'center', gap: spacing.xs, maxWidth: '100%' },
  headline: { color: colors.gold, fontWeight: '800', textAlign: 'center' },
  subline: { color: colors.textSecondary, textAlign: 'center' },
});
