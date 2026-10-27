import { useEffect, useState, type ReactNode } from 'react';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { openUserDatabase } from '@/database/open';
import { ReaderRepository } from '@/repositories/reader';
import { ReaderContext } from '@/services/reader-context';
import { StateScreen } from '@/components/StateScreen';
import { useReaderStore } from '@/store/reader';

export function ReaderProvider({ children }: { children: ReactNode }) {
  const content = useSQLiteContext();
  const [repository, setRepository] = useState<ReaderRepository | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let userDatabase: SQLiteDatabase | null = null;
    async function initialize() {
      userDatabase = await openUserDatabase();
      const reader = new ReaderRepository(content, userDatabase);
      await reader.validateContent();
      const language = await reader.getLanguage();
      if (active) {
        useReaderStore.getState().setLanguage(language);
        setRepository(reader);
      }
    }
    void initialize()
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        void SplashScreen.hideAsync();
        if (!active && userDatabase) {
          const database = userDatabase;
          userDatabase = null;
          void database.closeAsync();
        }
      });
    return () => {
      active = false;
      if (userDatabase) {
        const database = userDatabase;
        userDatabase = null;
        void database.closeAsync();
      }
    };
  }, [content, attempt]);
  if (error)
    return (
      <StateScreen
        message="We couldn’t prepare your reading library. Your saved data has not been reset."
        retry={() => {
          setError(false);
          setRepository(null);
          setAttempt((n) => n + 1);
        }}
      />
    );
  if (!repository)
    return <StateScreen message="Preparing your quiet space…" loading />;
  return (
    <ReaderContext.Provider value={repository}>
      {children}
    </ReaderContext.Provider>
  );
}
