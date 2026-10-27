export type Language = 'en' | 'hi';
export type ThemePreference = 'system' | 'light' | 'dark';
export type ReaderTextSize = 'standard' | 'large' | 'extraLarge';

export interface ReaderPreferences {
  language: Language;
  theme: ThemePreference;
  textSize: ReaderTextSize;
  showTransliteration: boolean;
}

export const DEFAULT_READER_PREFERENCES: Readonly<ReaderPreferences> = {
  language: 'en',
  theme: 'system',
  textSize: 'standard',
  showTransliteration: false,
};

export const preferenceKeys = {
  language: 'language',
  theme: 'theme',
  textSize: 'text_size',
  showTransliteration: 'show_transliteration',
} as const;

export function isPreferenceValue<K extends keyof ReaderPreferences>(
  key: K,
  value: unknown,
): value is ReaderPreferences[K] {
  switch (key) {
    case 'language':
      return value === 'en' || value === 'hi';
    case 'theme':
      return value === 'system' || value === 'light' || value === 'dark';
    case 'textSize':
      return (
        value === 'standard' || value === 'large' || value === 'extraLarge'
      );
    case 'showTransliteration':
      return typeof value === 'boolean';
    default:
      return false;
  }
}

export function parseReaderPreferences(
  values: Record<string, string>,
): ReaderPreferences {
  return {
    language: isPreferenceValue('language', values.language)
      ? values.language
      : DEFAULT_READER_PREFERENCES.language,
    theme: isPreferenceValue('theme', values.theme)
      ? values.theme
      : DEFAULT_READER_PREFERENCES.theme,
    textSize: isPreferenceValue('textSize', values.text_size)
      ? values.text_size
      : DEFAULT_READER_PREFERENCES.textSize,
    showTransliteration: values.show_transliteration === 'true',
  };
}

export function resolveTheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): 'light' | 'dark' {
  return preference === 'system'
    ? systemScheme === 'dark'
      ? 'dark'
      : 'light'
    : preference;
}

export function readerTextScale(size: ReaderTextSize): number {
  return { standard: 1, large: 1.2, extraLarge: 1.4 }[size];
}
