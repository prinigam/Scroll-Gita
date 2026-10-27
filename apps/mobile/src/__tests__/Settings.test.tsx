import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { DEFAULT_READER_PREFERENCES } from '@scroll-gita/storage';
import SettingsRoute from '@/app/settings';
import { ReaderContext } from '@/services/reader-context';
import type { ReaderRepository } from '@/repositories/reader';
import { useReaderStore } from '@/store/reader';

beforeEach(() =>
  useReaderStore.getState().applyPreferences({ ...DEFAULT_READER_PREFERENCES }),
);
function setup() {
  const setPreference = jest.fn(
    async (_key: string, _value: unknown): Promise<void> => undefined,
  );
  const repository = { setPreference } as unknown as ReaderRepository;
  return {
    setPreference,
    tree: (
      <ReaderContext.Provider value={repository}>
        <SettingsRoute />
      </ReaderContext.Provider>
    ),
  };
}

it('shows safe defaults and persists theme, language and transliteration choices', async () => {
  const { tree, setPreference } = setup();
  await render(tree);
  expect(
    screen.getByRole('radio', { name: 'System' }).props.accessibilityState
      .checked,
  ).toBe(true);
  expect(
    screen.getByRole('radio', { name: 'Standard' }).props.accessibilityState
      .checked,
  ).toBe(true);
  await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
  expect(setPreference).toHaveBeenLastCalledWith('theme', 'dark');
  expect(useReaderStore.getState().theme).toBe('dark');
  await fireEvent.press(screen.getByRole('radio', { name: 'हिन्दी' }));
  expect(setPreference).toHaveBeenLastCalledWith('language', 'hi');
  await fireEvent(
    screen.getByRole('switch', { name: 'Show transliteration' }),
    'valueChange',
    true,
  );
  expect(setPreference).toHaveBeenLastCalledWith('showTransliteration', true);
  expect(useReaderStore.getState().showTransliteration).toBe(true);
});

it('increases the preview size without truncating text or disabling phone font scaling', async () => {
  const { tree } = setup();
  await render(tree);
  const fontSize = () =>
    StyleSheet.flatten(screen.getByText('पाठ के आकार का नमूना').props.style)
      .fontSize;
  const standard = fontSize();
  await fireEvent.press(screen.getByRole('radio', { name: 'Large' }));
  const large = fontSize();
  expect(large).toBeGreaterThan(standard);
  await fireEvent.press(screen.getByRole('radio', { name: 'Extra large' }));
  expect(fontSize()).toBeGreaterThan(large);
  expect(
    screen.getByText('पाठ के आकार का नमूना').props.numberOfLines,
  ).toBeUndefined();
  expect(
    screen.getByText('पाठ के आकार का नमूना').props.allowFontScaling,
  ).not.toBe(false);
});

it('retains the previous preference after a failed save and supports retry', async () => {
  const { tree, setPreference } = setup();
  setPreference.mockRejectedValueOnce(new Error('disk unavailable'));
  await render(tree);
  await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
  expect(useReaderStore.getState().theme).toBe('system');
  expect(
    screen.getByRole('radio', { name: 'System' }).props.accessibilityState
      .checked,
  ).toBe(true);
  expect(screen.getByRole('alert')).toBeTruthy();
  await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
  expect(useReaderStore.getState().theme).toBe('dark');
  expect(screen.queryByRole('alert')).toBeNull();
});

it('waits for persistence and disables further changes while a save is pending', async () => {
  const { tree, setPreference } = setup();
  let finish!: () => void;
  setPreference.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  await render(tree);
  await fireEvent.press(screen.getByRole('radio', { name: 'Dark' }));
  expect(useReaderStore.getState().theme).toBe('system');
  expect(
    screen.getByRole('radio', { name: 'Light' }).props.accessibilityState
      .disabled,
  ).toBe(true);
  expect(
    screen.getByRole('switch', { name: 'Show transliteration' }).props.disabled,
  ).toBe(true);
  await act(async () => {
    finish();
  });
  expect(useReaderStore.getState().theme).toBe('dark');
  expect(
    screen.getByRole('radio', { name: 'Light' }).props.accessibilityState
      .disabled,
  ).toBe(false);
});
