import { useEffect } from 'react';
import { AccessibilityInfo, type FlatListProps } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ReaderScreen } from '@/features/reader/ReaderScreen';
import { ReaderContext } from '@/services/reader-context';
import type { ReaderRepository, Verse } from '@/repositories/reader';
import { useReaderStore } from '@/store/reader';
import { DEFAULT_READER_PREFERENCES } from '@scroll-gita/storage';

const mockFocus = { active: true };
const mockPush = jest.fn();
const mockListState = { scrollEnabled: true as boolean | undefined };
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (callback: () => void | (() => void)) => {
    // Simulate focus/blur while retaining the reader's mounted component state.
    const effect = jest.requireActual('react').useEffect as typeof useEffect;
    effect(
      () => (mockFocus.active ? callback() : undefined),
      [callback, mockFocus.active],
    );
  },
}));
let mockOnViewable:
  | ((info: { viewableItems: { item: Verse }[]; changed: unknown[] }) => void)
  | undefined;
jest.mock('react-native/Libraries/Lists/FlatList', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: React.forwardRef(function MockList(
      props: FlatListProps<Verse>,
      _ref: unknown,
    ) {
      mockOnViewable = props.onViewableItemsChanged as typeof mockOnViewable;
      mockListState.scrollEnabled = props.scrollEnabled;
      return React.createElement(
        View,
        null,
        React.createElement(
          Text,
          { testID: 'current-page' },
          props.data?.[props.initialScrollIndex ?? 0]?.ref,
        ),
      );
    }),
  };
});

const verses: Verse[] = ['1.1', '1.2', '2.47'].map((ref, position) => ({
  ref,
  position,
  chapter_number: Number(ref.split('.')[0]),
  verse_number: Number(ref.split('.')[1]),
  sanskrit: 'Layout placeholder',
  translation: 'Translation placeholder',
  transliteration: null,
  chapter_title: 'Sample chapter',
}));

beforeEach(() => {
  mockFocus.active = true;
  mockPush.mockClear();
  useReaderStore.setState({ ...DEFAULT_READER_PREFERENCES, bookmarkRefs: [] });
  jest
    .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
    .mockResolvedValue(false);
});
afterEach(() => jest.restoreAllMocks());

it('restores the selected verse on focus and ignores stale viewability events from a blurred reader', async () => {
  let progress = '1.1';
  const saveProgress = jest.fn(async (ref: string) => {
    progress = ref;
  });
  const repository = {
    getVerses: async () => verses,
    getProgress: async () => progress,
    validateContent: async () => ({ sample: true }),
    saveProgress,
  } as unknown as ReaderRepository;
  const tree = () => (
    <ReaderContext.Provider value={repository}>
      <ReaderScreen />
    </ReaderContext.Provider>
  );
  const view = await render(tree());
  await fireEvent(screen.getByTestId('verse-feed'), 'layout', {
    nativeEvent: { layout: { height: 600 } },
  });
  expect(screen.getByTestId('current-page').props.children).toBe('1.1');
  const oldViewability = mockOnViewable!;

  mockFocus.active = false;
  await view.rerender(tree());
  await repository.saveProgress('2.47');
  saveProgress.mockClear();
  await act(async () => {
    oldViewability({ viewableItems: [{ item: verses[0] }], changed: [] });
  });
  expect(saveProgress).not.toHaveBeenCalled();

  mockFocus.active = true;
  await view.rerender(tree());
  expect(screen.getByTestId('current-page').props.children).toBe('2.47');
  expect(screen.getByText('3 / 3')).toBeTruthy();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Browse chapters' }),
  );
  expect(mockPush).toHaveBeenLastCalledWith('/chapters');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Open saved verses' }),
  );
  expect(mockPush).toHaveBeenLastCalledWith('/bookmarks');
  await fireEvent.press(
    screen.getByRole('button', { name: 'Open reader settings' }),
  );
  expect(mockPush).toHaveBeenLastCalledWith('/settings');
  expect(saveProgress).not.toHaveBeenCalled();
});

it.each(['large text', 'screen reader'])(
  'keeps explicit verse navigation working with %s',
  async (mode) => {
    if (mode === 'large text')
      useReaderStore.setState({ textSize: 'extraLarge' });
    else
      jest
        .mocked(AccessibilityInfo.isScreenReaderEnabled)
        .mockResolvedValue(true);
    const saveProgress = jest.fn(async () => {});
    const repository = {
      getVerses: async () => verses,
      getProgress: async () => '1.1',
      validateContent: async () => ({ sample: true }),
      saveProgress,
    } as unknown as ReaderRepository;
    await render(
      <ReaderContext.Provider value={repository}>
        <ReaderScreen />
      </ReaderContext.Provider>,
    );
    await fireEvent(screen.getByTestId('verse-feed'), 'layout', {
      nativeEvent: { layout: { height: 600 } },
    });
    expect(mockListState.scrollEnabled).toBe(false);
    expect(
      screen.getByText('Scroll to read. Use Previous / Next to change verses.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Next verse' }));
    expect(saveProgress).toHaveBeenLastCalledWith('1.2');
    expect(screen.getByText('2 / 3')).toBeTruthy();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Previous verse' }),
    );
    expect(saveProgress).toHaveBeenLastCalledWith('1.1');
  },
);
