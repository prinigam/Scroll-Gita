import type { useEffect } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import ChaptersRoute from '@/app/chapters';
import ChapterRoute from '@/app/chapters/[number]';
import BookmarksRoute from '@/app/bookmarks';
import { ReaderContext } from '@/services/reader-context';
import type { ReaderRepository, Verse } from '@/repositories/reader';
import { useReaderStore } from '@/store/reader';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
const mockParams = { number: '2' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, dismissTo: mockDismissTo }),
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => void | (() => void)) => {
    const effect = jest.requireActual('react').useEffect as typeof useEffect;
    effect(callback, [callback]);
  },
}));
const verse: Verse = {
  ref: '2.47',
  chapter_number: 2,
  verse_number: 47,
  position: 2,
  sanskrit: 'Sample only',
  translation: 'English layout placeholder',
  chapter_title: 'Chapter 2 · layout preview',
  transliteration: null,
};
const chapters = [
  {
    number: 1,
    title: 'Chapter 1 · layout preview',
    verse_count: 47,
    available_verses: 2,
  },
  {
    number: 2,
    title: verse.chapter_title,
    verse_count: 72,
    available_verses: 1,
  },
];
function setup() {
  const saveProgress = jest.fn(async (_ref: string) => undefined);
  const getChapters = jest.fn(async () => chapters);
  const getChapterVerses = jest.fn(async () => [verse]);
  return {
    saveProgress,
    getChapters,
    getChapterVerses,
    validateContent: async () => ({ sample: true }),
    getProgress: async () => '2.47',
    getVerse: async () => verse,
    getBookmarks: jest.fn(
      async () =>
        [] as { verse_ref: string; created_at: string; verse: Verse }[],
    ),
    getBookmarkRefs: jest.fn(async () => [] as string[]),
    setBookmark: jest.fn(async (_ref: string, _saved: boolean) => undefined),
  };
}
beforeEach(() => {
  mockPush.mockClear();
  mockDismissTo.mockClear();
  mockParams.number = '2';
  useReaderStore.setState({ language: 'en', bookmarkRefs: [] });
});

it('shows actual sample coverage and browses chapters without moving the reading position', async () => {
  const repository = setup();
  await render(
    <ReaderContext.Provider value={repository as unknown as ReaderRepository}>
      <ChaptersRoute />
    </ReaderContext.Provider>,
  );
  expect(screen.getByText('2 of 47 verses available as samples')).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', {
      name: 'Browse chapter 2, 1 available verses',
    }),
  );
  expect(mockPush).toHaveBeenCalledWith({
    pathname: '/chapters/[number]',
    params: { number: '2' },
  });
  expect(repository.saveProgress).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Resume reading at verse 2.47' }),
  );
  expect(repository.saveProgress).toHaveBeenCalledWith('2.47');
  expect(mockDismissTo).toHaveBeenCalledWith('/');
});

it('selects a chapter verse and returns to the reader after persistence', async () => {
  const repository = setup();
  await render(
    <ReaderContext.Provider value={repository as unknown as ReaderRepository}>
      <ChapterRoute />
    </ReaderContext.Provider>,
  );
  expect(repository.getChapterVerses).toHaveBeenCalledWith(2, 'en');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Read verse 2.47' }),
  );
  expect(repository.saveProgress).toHaveBeenCalledWith('2.47');
  expect(mockDismissTo).toHaveBeenCalledWith('/');
});

it('rejects an out-of-range chapter route without querying verse rows', async () => {
  mockParams.number = '19';
  const repository = setup();
  await render(
    <ReaderContext.Provider value={repository as unknown as ReaderRepository}>
      <ChapterRoute />
    </ReaderContext.Provider>,
  );
  expect(
    screen.getByText('This chapter is not available in your offline library.'),
  ).toBeTruthy();
  expect(repository.getChapterVerses).not.toHaveBeenCalled();
});

it('shows an empty saved library with a useful action hint', async () => {
  const repository = setup();
  await render(
    <ReaderContext.Provider value={repository as unknown as ReaderRepository}>
      <BookmarksRoute />
    </ReaderContext.Provider>,
  );
  expect(screen.getByText('No saved verses yet')).toBeTruthy();
  expect(repository.saveProgress).not.toHaveBeenCalled();
});

it('opens a saved verse and refreshes the list after its last bookmark is removed', async () => {
  let saved = true;
  const repository = setup();
  repository.getBookmarks.mockImplementation(async () =>
    saved ? [{ verse_ref: verse.ref, created_at: '2026-10-28', verse }] : [],
  );
  repository.getBookmarkRefs.mockImplementation(async () =>
    saved ? [verse.ref] : [],
  );
  repository.setBookmark.mockImplementation(async (_ref, value) => {
    saved = value;
  });
  useReaderStore.setState({ bookmarkRefs: [verse.ref] });
  await render(
    <ReaderContext.Provider value={repository as unknown as ReaderRepository}>
      <BookmarksRoute />
    </ReaderContext.Provider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Read verse 2.47' }),
  );
  expect(repository.saveProgress).toHaveBeenCalledWith('2.47');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove bookmark for verse 2.47' }),
  );
  expect(repository.setBookmark).toHaveBeenCalledWith('2.47', false);
  expect(await screen.findByText('No saved verses yet')).toBeTruthy();
});
