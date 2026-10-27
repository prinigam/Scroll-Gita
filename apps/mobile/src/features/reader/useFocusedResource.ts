import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

// Refresh local data when returning to a screen; ignore responses from blurred routes.
export function useFocusedResource<T>(
  load: () => Promise<T>,
  refreshKey?: unknown,
) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    load: typeof load;
    refreshKey: unknown;
    value: T;
  } | null>(null);
  const [failure, setFailure] = useState<{
    load: typeof load;
    attempt: number;
    refreshKey: unknown;
  } | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      void load()
        .then((value) => {
          if (active) {
            setResult({ load, refreshKey, value });
            setFailure(null);
          }
        })
        .catch(() => {
          if (active) setFailure({ load, attempt, refreshKey });
        });
      return () => {
        active = false;
      };
    }, [load, attempt, refreshKey]),
  );
  return {
    data:
      result?.load === load && result.refreshKey === refreshKey
        ? result.value
        : null,
    error:
      failure?.load === load &&
      failure.attempt === attempt &&
      failure.refreshKey === refreshKey,
    retry: () => {
      setResult(null);
      setAttempt((value) => value + 1);
    },
  };
}
