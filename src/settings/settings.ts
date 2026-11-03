export interface Settings {
  hapticsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = { hapticsEnabled: true };

export const SETTINGS_STORAGE_KEY = 'card-keeper/settings';
export const SETTINGS_VERSION = 1;

/** Validates untrusted persisted settings, falling back to defaults per field. */
export function sanitizeSettings(raw: unknown): Settings {
  const value = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    hapticsEnabled:
      typeof value.hapticsEnabled === 'boolean'
        ? value.hapticsEnabled
        : DEFAULT_SETTINGS.hapticsEnabled,
  };
}
