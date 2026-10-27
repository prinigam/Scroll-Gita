import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type FlatListProps,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VerseCard } from '@/components/VerseCard';
import { StateScreen } from '@/components/StateScreen';
import type { Verse } from '@/repositories/reader';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';
import { readerTextScale } from '@scroll-gita/storage';

export function ReaderScreen() {
  const repository = useReaderRepository();
  const colors = usePalette();
  const router = useRouter();
  const language = useReaderStore((state) => state.language);
  const textSize = useReaderStore((state) => state.textSize);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [height, setHeight] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [writeError, setWriteError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [screenReader, setScreenReader] = useState(false);
  const [sample, setSample] = useState(true);
  const list = useRef<FlatList<Verse>>(null);
  const session = useRef(0);
  const [loadedSession, setLoadedSession] = useState(0);
  const { fontScale, width } = useWindowDimensions();
  const accessiblePaging =
    screenReader || fontScale * readerTextScale(textSize) > 1.25;
  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReader,
    );
    return () => subscription.remove();
  }, []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadingSession = ++session.current;
      setReady(false);
      void (async () => {
        const [rows, ref, metadata] = await Promise.all([
          repository.getVerses(language),
          repository.getProgress(),
          repository.validateContent(),
        ]);
        const index = Math.max(
          0,
          rows.findIndex((row) => row.ref === ref),
        );
        if (active) {
          setVerses(rows);
          setCurrentIndex(index);
          setSample(metadata.sample);
          setLoadedSession(loadingSession);
          setReady(true);
        }
      })().catch(() => {
        if (active) setError(true);
      });
      return () => {
        active = false;
        session.current++;
      };
      // The counter deliberately reloads this focus effect after a retry.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [repository, language, attempt]),
  );

  const savePosition = useCallback(
    (verse: Verse) => {
      if (session.current !== loadedSession) return;
      setCurrentIndex(verse.position);
      void repository
        .saveProgress(verse.ref)
        .then(() => setWriteError(false))
        .catch(() => setWriteError(true));
    },
    [repository, loadedSession],
  );
  const onViewableItemsChanged = useCallback<
    NonNullable<FlatListProps<Verse>['onViewableItemsChanged']>
  >(
    ({ viewableItems }) => {
      const item = viewableItems[0]?.item;
      if (item) savePosition(item);
    },
    [savePosition],
  );
  const switchLanguage = async () => {
    const next = language === 'en' ? 'hi' : 'en';
    try {
      await repository.setLanguage(next);
      setReady(false);
      useReaderStore.getState().setLanguage(next);
    } catch {
      setWriteError(true);
    }
  };
  const navigate = (offset: number) => {
    const index = Math.max(
      0,
      Math.min(verses.length - 1, currentIndex + offset),
    );
    list.current?.scrollToIndex({ index, animated: false });
    if (verses[index]) savePosition(verses[index]);
  };
  if (error)
    return (
      <StateScreen
        message="We couldn’t load your offline verses."
        retry={() => {
          setError(false);
          setReady(false);
          setAttempt((n) => n + 1);
        }}
      />
    );
  if (!ready) return <StateScreen message="Opening your library…" loading />;
  if (!verses.length)
    return (
      <StateScreen message="No verses are available in this content release." />
    );
  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Browse chapters"
          onPress={() => router.push('/chapters')}
          style={styles.chapterLink}
        >
          <Text style={[styles.brand, { color: colors.text }]}>GITA</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Chapters ⌄
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open saved verses"
          onPress={() => router.push('/bookmarks')}
          style={[styles.libraryLink, { backgroundColor: colors.surface }]}
        >
          <Text style={{ color: colors.accent }}>Saved ↗</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            language === 'en'
              ? 'Switch to Hindi translation'
              : 'Switch to English translation'
          }
          onPress={() => void switchLanguage()}
          style={[styles.language, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text }}>
            {language === 'en' ? 'EN / हिन्दी' : 'हिन्दी / EN'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open reader settings"
          onPress={() => router.push('/settings')}
          style={[styles.settings, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.text, fontSize: 22 }}>⚙︎</Text>
        </Pressable>
      </View>
      {sample && (
        <Text
          accessibilityRole="alert"
          style={[
            styles.notice,
            { color: colors.accent, backgroundColor: colors.surface },
          ]}
        >
          LAYOUT PREVIEW · SAMPLE TEXT, NOT SCRIPTURE
        </Text>
      )}
      {writeError && (
        <Text
          accessibilityRole="alert"
          style={[styles.notice, { color: colors.accent }]}
        >
          Couldn’t save your latest change. Please try again.
        </Text>
      )}
      <View
        testID="verse-feed"
        style={styles.feed}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        {height > 0 && (
          <FlatList
            key={`${loadedSession}-${height}-${width}`}
            ref={list}
            data={verses}
            renderItem={({ item }) => (
              <VerseCard
                verse={item}
                height={height}
                largeText={accessiblePaging}
                sample={sample}
              />
            )}
            keyExtractor={(item) => item.ref}
            initialScrollIndex={currentIndex}
            getItemLayout={(_, index) => ({
              length: height,
              offset: height * index,
              index,
            })}
            pagingEnabled
            scrollEnabled={!accessiblePaging}
            showsVerticalScrollIndicator={false}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
            onViewableItemsChanged={onViewableItemsChanged}
          />
        )}
      </View>
      {accessiblePaging && (
        <Text style={[styles.readingHint, { color: colors.muted }]}>
          Scroll to read. Use Previous / Next to change verses.
        </Text>
      )}
      <View
        style={[
          styles.footer,
          fontScale > 1.75 && styles.footerLarge,
          { borderTopColor: colors.border },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous verse"
          disabled={currentIndex === 0}
          onPress={() => navigate(-1)}
          style={[styles.control, { opacity: currentIndex === 0 ? 0.35 : 1 }]}
        >
          <Text style={{ color: colors.text }}>← Previous</Text>
        </Pressable>
        <Text style={[styles.counter, { color: colors.muted }]}>
          {currentIndex + 1} / {verses.length}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next verse"
          disabled={currentIndex === verses.length - 1}
          onPress={() => navigate(1)}
          style={[
            styles.control,
            { opacity: currentIndex === verses.length - 1 ? 0.35 : 1 },
          ]}
        >
          <Text style={{ color: colors.text }}>Next →</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  chapterLink: { minHeight: 44, justifyContent: 'center', flexShrink: 1 },
  libraryLink: {
    minHeight: 44,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  settings: {
    minHeight: 44,
    minWidth: 44,
    padding: 6,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readingHint: {
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  brand: { fontSize: 23, fontWeight: '600', letterSpacing: 6 },
  subtitle: { fontSize: 11, marginTop: 6 },
  language: {
    minHeight: 44,
    minWidth: 88,
    padding: 10,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notice: {
    fontSize: 10,
    lineHeight: 17,
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    textAlign: 'center',
  },
  feed: { flex: 1 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLarge: { flexDirection: 'column', alignItems: 'stretch' },
  control: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  counter: { fontSize: 11, letterSpacing: 1, textAlign: 'center' },
});
