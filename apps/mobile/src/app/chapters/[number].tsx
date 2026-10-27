import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StateScreen } from '@/components/StateScreen';
import { VerseRow } from '@/components/VerseRow';
import { useFocusedResource } from '@/features/reader/useFocusedResource';
import { useOpenVerse } from '@/features/reader/useOpenVerse';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';

export default function ChapterRoute() {
  const { number } = useLocalSearchParams<{ number: string }>();
  const repository = useReaderRepository();
  const language = useReaderStore((state) => state.language);
  const colors = usePalette();
  const { openVerse, opening, error: openError } = useOpenVerse();
  const load = useCallback(async () => {
    const valid = typeof number === 'string' && /^([1-9]|1[0-8])$/.test(number);
    const chapter = valid
      ? (await repository.getChapters()).find(
          (row) => row.number === Number(number),
        )
      : null;
    const verses = chapter
      ? await repository.getChapterVerses(chapter.number, language)
      : [];
    const metadata = await repository.validateContent();
    return { chapter, verses, sample: metadata.sample };
  }, [repository, number, language]);
  const { data, error, retry } = useFocusedResource(load);
  if (error)
    return (
      <StateScreen message="We couldn’t load this chapter." retry={retry} />
    );
  if (!data) return <StateScreen message="Opening chapter…" loading />;
  if (!data.chapter)
    return (
      <StateScreen message="This chapter is not available in your offline library." />
    );
  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <FlatList
        data={data.verses}
        keyExtractor={(verse) => verse.ref}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.text }]}
            >
              {data.chapter.title}
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              {data.sample
                ? `${data.verses.length} sample verses · not scripture. Missing verses are not bundled yet.`
                : `${data.verses.length} verses · select one to read`}
            </Text>
            {openError && (
              <Text
                accessibilityRole="alert"
                style={[styles.body, { color: colors.accent }]}
              >
                Couldn’t open that verse. Please try again.
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.body, { color: colors.muted }]}>
            No verses are available in this chapter yet.
          </Text>
        }
        renderItem={({ item }) => (
          <VerseRow
            verse={item}
            disabled={opening}
            onPress={() => void openVerse(item.ref)}
          />
        )}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  intro: { gap: 16, paddingVertical: 24 },
  title: { fontSize: 26, lineHeight: 35, fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 24 },
});
