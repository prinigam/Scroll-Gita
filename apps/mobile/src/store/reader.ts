import { create } from 'zustand';

export type Language = 'en' | 'hi';
interface ReaderState {
  language: Language;
  setLanguage: (language: Language) => void;
}
export const useReaderStore = create<ReaderState>((set) => ({
  language: 'en',
  setLanguage: (language) => set({ language }),
}));
