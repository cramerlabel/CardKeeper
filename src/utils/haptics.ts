import * as Haptics from 'expo-haptics';

import { useSettingsStore } from '@/settings';

const enabled = () => useSettingsStore.getState().hapticsEnabled;
const ignore = () => {};

/** Haptic feedback helpers; every call is a no-op while haptics are muted in settings. */
export const haptics = {
  tap: () => {
    if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(ignore);
  },
  success: () => {
    if (enabled())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(ignore);
  },
  warning: () => {
    if (enabled())
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(ignore);
  },
};
