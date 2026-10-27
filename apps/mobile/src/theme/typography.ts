import { readerTextScale } from '@scroll-gita/storage';
import { useReaderStore } from '@/store/reader';

export function useReaderTypography() {
  const textSize = useReaderStore((state) => state.textSize);
  const scale = readerTextScale(textSize);
  return {
    sanskrit: { fontSize: 27 * scale, lineHeight: 43 * scale },
    translation: { fontSize: 20 * scale, lineHeight: 31 * scale },
    transliteration: { fontSize: 16 * scale, lineHeight: 26 * scale },
    body: { fontSize: 17 * scale, lineHeight: 27 * scale },
  };
}
