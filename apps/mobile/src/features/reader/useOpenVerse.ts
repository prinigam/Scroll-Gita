import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useReaderRepository } from '@/services/reader-context';

export function useOpenVerse() {
  const repository = useReaderRepository();
  const router = useRouter();
  const busy = useRef(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(false);
  const openVerse = async (ref: string) => {
    if (busy.current) return;
    busy.current = true;
    setOpening(true);
    setError(false);
    try {
      // Complete the validated write before the reader regains focus.
      await repository.saveProgress(ref);
      router.dismissTo('/');
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setOpening(false);
    }
  };
  return { openVerse, opening, error };
}
