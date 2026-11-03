import { useKeepAwake } from 'expo-keep-awake';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorFallback } from '@/components/ErrorFallback';
import { useGinStore } from '@/games/ginRummy/store';
import { colors } from '@/theme';

SplashScreen.setOptions({ duration: 300, fade: true });

/** Expo Router renders this in place of the layout when any screen throws. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorFallback
        error={error}
        onRetry={() => void retry()}
        onReset={() => {
          useGinStore.getState().clear();
          void retry();
        }}
      />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  useKeepAwake();

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.felt },
          animation: 'slide_from_right',
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="gin/game-over" options={{ animation: 'fade' }} />
        <Stack.Screen name="gin/hand" options={{ animation: 'slide_from_bottom' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
