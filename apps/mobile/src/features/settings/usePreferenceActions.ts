import { useRef, useState } from 'react';
import type { ReaderPreferences } from '@scroll-gita/storage';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';

export function usePreferenceActions() {
  const repository = useReaderRepository();
  const busy = useRef(false);
  const [pending, setPending] = useState<keyof ReaderPreferences | null>(null);
  const [error, setError] = useState(false);
  const save = async <K extends keyof ReaderPreferences>(
    key: K,
    value: ReaderPreferences[K],
  ) => {
    if (busy.current) return;
    busy.current = true;
    setPending(key);
    setError(false);
    try {
      await repository.setPreference(key, value);
      useReaderStore.getState().setPreference(key, value);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setPending(null);
    }
  };
  return { save, pending, error };
}
