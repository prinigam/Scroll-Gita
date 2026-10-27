import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DEFAULT_READER_PREFERENCES } from '@scroll-gita/storage';
import { VerseCard } from '@/components/VerseCard';
import type { Verse } from '@/repositories/reader';
import { useReaderStore } from '@/store/reader';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/components/BookmarkButton', () => ({
  BookmarkButton: () => null,
}));

const verse: Verse = {
  ref: '2.47',
  chapter_number: 2,
  verse_number: 47,
  position: 0,
  sanskrit: 'संस्कृत पाठ का स्थान',
  transliteration: null,
  translation: 'Explicit sample translation placeholder.',
  chapter_title: 'Layout preview',
};

describe('VerseCard', () => {
  beforeEach(() =>
    useReaderStore
      .getState()
      .applyPreferences({ ...DEFAULT_READER_PREFERENCES }),
  );
  afterEach(() => jest.clearAllMocks());
  it('renders the complete supplied text and coordinate without truncation', async () => {
    await render(<VerseCard verse={verse} height={640} largeText={false} />);
    expect(screen.getByText('CHAPTER 2 · VERSE 47')).toBeTruthy();
    expect(
      screen.getByText(verse.sanskrit).props.numberOfLines,
    ).toBeUndefined();
    expect(
      screen.getByText(verse.translation).props.numberOfLines,
    ).toBeUndefined();
    expect(screen.getByText(verse.translation).props.allowFontScaling).not.toBe(
      false,
    );
  });

  it('renders the Hindi content supplied by the repository at large text sizes', async () => {
    await render(
      <VerseCard
        verse={{ ...verse, translation: 'यह अनुवाद का नमूना है।' }}
        height={400}
        largeText
        sample
      />,
    );
    expect(screen.getByText('यह अनुवाद का नमूना है।')).toBeTruthy();
    expect(screen.getByLabelText(/Sanskrit placeholder/)).toBeTruthy();
  });

  it('opens study navigation using the stable verse reference', async () => {
    await render(
      <VerseCard verse={verse} height={640} largeText={false} sample />,
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Open verse details for 2.47' }),
    );
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/study/[ref]',
      params: { ref: '2.47' },
    });
  });

  it('shows source transliteration only when enabled and scales verse reading text', async () => {
    const text = 'Transliteration layout placeholder.';
    await render(
      <VerseCard
        verse={{ ...verse, transliteration: text }}
        height={600}
        largeText={false}
        sample
      />,
    );
    const initial = StyleSheet.flatten(
      screen.getByText(verse.sanskrit).props.style,
    ).fontSize;
    expect(screen.queryByText(text)).toBeNull();
    await act(async () => {
      useReaderStore.getState().setPreference('showTransliteration', true);
      useReaderStore.getState().setPreference('textSize', 'extraLarge');
    });
    expect(screen.getByText(text)).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByText(verse.sanskrit).props.style).fontSize,
    ).toBeGreaterThan(initial);
    expect(screen.getByText(text).props.numberOfLines).toBeUndefined();
    await act(async () => {
      useReaderStore.getState().setPreference('showTransliteration', false);
    });
    expect(screen.queryByText(text)).toBeNull();
  });

  it('does not fabricate transliteration when a verse has none', async () => {
    useReaderStore.setState({ showTransliteration: true });
    await render(<VerseCard verse={verse} height={400} largeText sample />);
    expect(screen.queryByLabelText(/^Transliteration for verse/)).toBeNull();
  });
});
