import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { DEFAULT_READER_PREFERENCES } from '@scroll-gita/storage';
import { usePalette, useResolvedTheme } from '@/theme';
import { useReaderStore } from '@/store/reader';

const mockSystem = { scheme: 'light' as 'light' | 'dark' | null };
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  __esModule: true,
  default: () => mockSystem.scheme,
}));

function Preview() {
  const mode = useResolvedTheme();
  const colors = usePalette();
  return (
    <Text
      testID="appearance"
      style={{ color: colors.text, backgroundColor: colors.background }}
    >
      {mode}
    </Text>
  );
}
beforeEach(() => {
  mockSystem.scheme = 'light';
  useReaderStore.getState().applyPreferences({ ...DEFAULT_READER_PREFERENCES });
});

it('follows phone appearance in System mode and preserves explicit overrides', async () => {
  const view = await render(<Preview />);
  expect(screen.getByText('light')).toBeTruthy();
  mockSystem.scheme = 'dark';
  await view.rerender(<Preview />);
  expect(screen.getByText('dark')).toBeTruthy();
  await act(async () => {
    useReaderStore.getState().setPreference('theme', 'light');
  });
  expect(screen.getByText('light')).toBeTruthy();
  mockSystem.scheme = 'light';
  await act(async () => {
    useReaderStore.getState().setPreference('theme', 'dark');
  });
  await view.rerender(<Preview />);
  expect(screen.getByText('dark')).toBeTruthy();
  await act(async () => {
    useReaderStore.getState().setPreference('theme', 'system');
  });
  expect(screen.getByText('light')).toBeTruthy();
});
