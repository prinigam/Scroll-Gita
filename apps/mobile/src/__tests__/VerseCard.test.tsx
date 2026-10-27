import { fireEvent, render, screen } from '@testing-library/react-native';
import { VerseCard } from '@/components/VerseCard';
import type { Verse } from '@/repositories/reader';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

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
});
