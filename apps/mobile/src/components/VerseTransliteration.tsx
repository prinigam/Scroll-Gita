import { Text } from 'react-native';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';
import { useReaderTypography } from '@/theme/typography';

export function VerseTransliteration({
  verseRef,
  text,
  align = 'center',
}: {
  verseRef: string;
  text: string | null;
  align?: 'left' | 'center';
}) {
  const show = useReaderStore((state) => state.showTransliteration);
  const colors = usePalette();
  const typography = useReaderTypography();
  if (!show || !text?.trim()) return null;
  return (
    <Text
      accessibilityLabel={`Transliteration for verse ${verseRef}: ${text}`}
      style={[
        typography.transliteration,
        { textAlign: align, color: colors.muted, marginTop: 16 },
      ]}
    >
      {text}
    </Text>
  );
}
