import { StyleSheet } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { DEFAULT_READER_PREFERENCES } from '@scroll-gita/storage';
import VerseDetails from '@/app/study/[ref]';
import type { ReaderRepository, Verse } from '@/repositories/reader';
import { ReaderContext } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ ref: '2.47' }),
}));
jest.mock('@/components/BookmarkButton', () => ({
  BookmarkButton: () => null,
}));

it('applies reading preferences to the full verse in details as well as the feed', async () => {
  useReaderStore.setState({ ...DEFAULT_READER_PREFERENCES });
  const verse: Verse = {
    ref: '2.47',
    position: 0,
    chapter_number: 2,
    verse_number: 47,
    chapter_title: 'Layout preview',
    sanskrit: 'पाठ का नमूना',
    translation: 'Translation layout placeholder.',
    transliteration: 'Transliteration layout placeholder.',
  };
  const repository = {
    getVerse: jest.fn(async () => verse),
    validateContent: async () => ({ sample: true }),
  } as unknown as ReaderRepository;
  await render(
    <ReaderContext.Provider value={repository}>
      <VerseDetails />
    </ReaderContext.Provider>,
  );
  const initial = StyleSheet.flatten(
    screen.getByText(verse.translation).props.style,
  ).fontSize;
  expect(screen.queryByText(verse.transliteration!)).toBeNull();
  await act(async () => {
    useReaderStore.setState({
      showTransliteration: true,
      textSize: 'extraLarge',
    });
  });
  expect(screen.getByText(verse.transliteration!)).toBeTruthy();
  expect(
    StyleSheet.flatten(screen.getByText(verse.translation).props.style)
      .fontSize,
  ).toBeGreaterThan(initial);
  expect(
    screen.getByText(verse.translation).props.numberOfLines,
  ).toBeUndefined();
  expect(screen.getByText(verse.translation).props.allowFontScaling).not.toBe(
    false,
  );
  expect(repository.getVerse).toHaveBeenCalledTimes(1);
});
