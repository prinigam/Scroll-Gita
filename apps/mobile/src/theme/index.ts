import { useColorScheme } from 'react-native';
import { resolveTheme } from '@scroll-gita/storage';
import { useReaderStore } from '@/store/reader';

export const palettes = {
  light: {
    background: '#F7F3EA',
    surface: '#EEE7D9',
    text: '#262820',
    muted: '#6C6E62',
    accent: '#8B592C',
    border: '#D9D2C3',
  },
  dark: {
    background: '#171D19',
    surface: '#242D26',
    text: '#F3ECDC',
    muted: '#ACAFA0',
    accent: '#DFBA7E',
    border: '#3D473E',
  },
};
export type Palette = typeof palettes.light;
export function useResolvedTheme() {
  const preference = useReaderStore((state) => state.theme);
  const system = useColorScheme();
  return resolveTheme(preference, system);
}
export function usePalette() {
  return palettes[useResolvedTheme()];
}
