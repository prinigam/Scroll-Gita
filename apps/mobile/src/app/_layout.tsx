import { useState } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StateScreen } from '@/components/StateScreen';
import { usePalette } from '@/theme';
import manifest from '../../assets/content/manifest.json';
import { ReaderProvider } from '@/services/ReaderProvider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function RootLayout() {
  const colors = usePalette();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar
            style={colors.background === '#171D19' ? 'light' : 'dark'}
          />
          {error ? (
            <StateScreen
              message="We couldn’t open the offline content."
              retry={() => {
                setError(false);
                setAttempt((n) => n + 1);
              }}
            />
          ) : (
            <SQLiteProvider
              key={attempt}
              databaseName={`gita_content_${manifest.version}.db`}
              assetSource={{
                assetId: require('../../assets/content/gita_content.db'),
              }}
              onError={() => {
                setError(true);
                void SplashScreen.hideAsync();
              }}
            >
              <ReaderProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.background },
                  }}
                >
                  <Stack.Screen
                    name="study/[ref]"
                    options={{
                      headerShown: true,
                      title: 'Verse details',
                      headerStyle: { backgroundColor: colors.background },
                      headerTintColor: colors.text,
                      headerShadowVisible: false,
                    }}
                  />
                </Stack>
              </ReaderProvider>
            </SQLiteProvider>
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
