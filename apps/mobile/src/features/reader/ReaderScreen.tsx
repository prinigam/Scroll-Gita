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
import { SafeAreaView } from 'react-native-safe-area-context';
import { VerseCard } from '@/components/VerseCard';
import { StateScreen } from '@/components/StateScreen';
import type { Verse } from '@/repositories/reader';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';

export function ReaderScreen() {
  const repository = useReaderRepository();
  const colors = usePalette();
  const language = useReaderStore((state) => state.language);
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
  const writes = useRef(Promise.resolve());
  const { fontScale, width } = useWindowDimensions();
  const accessiblePaging = screenReader || fontScale > 1.25;
  useEffect(() => {
    void AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader);
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReader,
    );
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    let active = true;
    void (async () => {
      // Finish queued writes before reading the saved position during a language change.
      await writes.current;
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
        setReady(true);
      }
    })().catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
    };
  }, [repository, language, attempt]);

  const savePosition = useCallback(
    (verse: Verse) => {
      setCurrentIndex(verse.position);
      writes.current = writes.current
        .then(() => repository.saveProgress(verse.ref))
        .then(() => setWriteError(false))
        .catch(() => setWriteError(true));
    },
    [repository],
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
        <View>
          <Text style={[styles.brand, { color: colors.text }]}>GITA</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            A LITTLE SPACE WITHIN
          </Text>
        </View>
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
        style={styles.feed}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        {height > 0 && (
          <FlatList
            key={`${language}-${height}-${width}`}
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
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  brand: { fontSize: 23, fontWeight: '600', letterSpacing: 6 },
  subtitle: { fontSize: 8, letterSpacing: 1.5, marginTop: 6 },
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  control: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 8 },
  counter: { fontSize: 11, letterSpacing: 1 },
});
