import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BookmarkButton } from '@/components/BookmarkButton';
import { ReaderContext } from '@/services/reader-context';
import type { ReaderRepository } from '@/repositories/reader';
import { useReaderStore } from '@/store/reader';

function setup(saved = false) {
  const refs = new Set(saved ? ['2.47'] : []);
  const setBookmark = jest.fn(async (ref: string, value: boolean) => {
    if (value) refs.add(ref);
    else refs.delete(ref);
  });
  const getBookmarkRefs = jest.fn(async () => [...refs]);
  const repository = {
    setBookmark,
    getBookmarkRefs,
  } as unknown as ReaderRepository;
  return { repository, setBookmark };
}

beforeEach(() => useReaderStore.setState({ bookmarkRefs: [] }));

it('saves and removes a verse, updating shared state after successful persistence', async () => {
  const { repository, setBookmark } = setup();
  await render(
    <ReaderContext.Provider value={repository}>
      <BookmarkButton verseRef="2.47" />
    </ReaderContext.Provider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Bookmark verse 2.47' }),
  );
  expect(setBookmark).toHaveBeenLastCalledWith('2.47', true);
  expect(useReaderStore.getState().bookmarkRefs).toEqual(['2.47']);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove bookmark for verse 2.47' }),
  );
  expect(setBookmark).toHaveBeenLastCalledWith('2.47', false);
  expect(useReaderStore.getState().bookmarkRefs).toEqual([]);
});

it('reflects bookmark changes made on another screen', async () => {
  const { repository } = setup();
  await render(
    <ReaderContext.Provider value={repository}>
      <BookmarkButton verseRef="2.47" />
    </ReaderContext.Provider>,
  );
  await act(async () => {
    useReaderStore.getState().setBookmarkRefs(['2.47']);
  });
  expect(
    screen.getByRole('button', { name: 'Remove bookmark for verse 2.47' }),
  ).toBeTruthy();
});

it('keeps a saved verse selected when removal fails and allows retry', async () => {
  const { repository, setBookmark } = setup(true);
  useReaderStore.setState({ bookmarkRefs: ['2.47'] });
  setBookmark.mockRejectedValueOnce(new Error('disk full'));
  await render(
    <ReaderContext.Provider value={repository}>
      <BookmarkButton verseRef="2.47" />
    </ReaderContext.Provider>,
  );
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove bookmark for verse 2.47' }),
  );
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(useReaderStore.getState().bookmarkRefs).toEqual(['2.47']);
  await fireEvent.press(
    screen.getByRole('button', { name: 'Remove bookmark for verse 2.47' }),
  );
  expect(useReaderStore.getState().bookmarkRefs).toEqual([]);
});
