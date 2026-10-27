import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { useOpenVerse } from '@/features/reader/useOpenVerse';
import { ReaderContext } from '@/services/reader-context';
import type { ReaderRepository } from '@/repositories/reader';

const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: mockDismissTo }),
}));

function wrapper(repository: ReaderRepository) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ReaderContext.Provider value={repository}>
        {children}
      </ReaderContext.Provider>
    );
  };
}
afterEach(() => jest.clearAllMocks());

it('waits for the selected position to persist before returning to the reader', async () => {
  let finish!: () => void;
  const saveProgress = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const repository = { saveProgress } as unknown as ReaderRepository;
  const { result } = await renderHook(() => useOpenVerse(), {
    wrapper: wrapper(repository),
  });
  let pending!: Promise<void>;
  await act(async () => {
    pending = result.current.openVerse('2.47');
  });
  expect(saveProgress).toHaveBeenCalledWith('2.47');
  expect(mockDismissTo).not.toHaveBeenCalled();
  expect(result.current.opening).toBe(true);
  await act(async () => {
    await result.current.openVerse('1.1');
  });
  expect(saveProgress).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
    await pending;
  });
  expect(mockDismissTo).toHaveBeenCalledWith('/');
  expect(result.current.opening).toBe(false);
});

it('stays on the list and exposes a retryable error if selecting a verse fails', async () => {
  const saveProgress = jest
    .fn()
    .mockRejectedValueOnce(new Error('storage failure'))
    .mockResolvedValue(undefined);
  const repository = { saveProgress } as unknown as ReaderRepository;
  const { result } = await renderHook(() => useOpenVerse(), {
    wrapper: wrapper(repository),
  });
  await act(async () => {
    await result.current.openVerse('2.47');
  });
  expect(result.current.error).toBe(true);
  expect(mockDismissTo).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.openVerse('2.47');
  });
  expect(result.current.error).toBe(false);
  expect(mockDismissTo).toHaveBeenCalledTimes(1);
});
