import { create } from 'zustand';
import {
  DEFAULT_READER_PREFERENCES,
  type ReaderPreferences,
} from '@scroll-gita/storage';

export type { Language } from '@scroll-gita/storage';
interface ReaderState extends ReaderPreferences {
  setLanguage: (language: ReaderPreferences['language']) => void;
  applyPreferences: (preferences: ReaderPreferences) => void;
  setPreference: <K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K],
  ) => void;
  bookmarkRefs: string[];
  setBookmarkRefs: (refs: string[]) => void;
}
export const useReaderStore = create<ReaderState>((set) => ({
  ...DEFAULT_READER_PREFERENCES,
  setLanguage: (language) => set({ language }),
  applyPreferences: (preferences) => set(preferences),
  setPreference: (key, value) => set((state) => ({ ...state, [key]: value })),
  bookmarkRefs: [],
  setBookmarkRefs: (bookmarkRefs) => set({ bookmarkRefs }),
}));
