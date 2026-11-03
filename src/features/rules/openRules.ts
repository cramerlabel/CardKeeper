import { router } from 'expo-router';

export function openRules(gameId: string) {
  router.push(`/rules/${gameId}` as never);
}
