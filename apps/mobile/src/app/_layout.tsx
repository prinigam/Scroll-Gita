import { useMemo, useState } from 'react';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StateScreen } from '@/components/StateScreen';
import { palettes, useResolvedTheme } from '@/theme';
import manifest from '../../assets/content/manifest.json';
import { ReaderProvider } from '@/services/ReaderProvider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1 } },
});

export default function RootLayout() {
  const mode = useResolvedTheme();
  const colors = palettes[mode];
  const navigationTheme = useMemo(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.background,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    };
  }, [mode, colors]);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return (
    <ThemeProvider value={navigationTheme}>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
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
                      name="chapters/index"
                      options={{
                        headerShown: true,
                        title: 'Chapters',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                        headerShadowVisible: false,
                      }}
                    />
                    <Stack.Screen
                      name="chapters/[number]"
                      options={{
                        headerShown: true,
                        title: 'Chapter verses',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                        headerShadowVisible: false,
                      }}
                    />
                    <Stack.Screen
                      name="bookmarks"
                      options={{
                        headerShown: true,
                        title: 'Saved verses',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                        headerShadowVisible: false,
                      }}
                    />
                    <Stack.Screen
                      name="settings"
                      options={{
                        headerShown: true,
                        title: 'Reader settings',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                        headerShadowVisible: false,
                      }}
                    />
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
    </ThemeProvider>
  );
}
