import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StateScreen } from '@/components/StateScreen';
import { useFocusedResource } from '@/features/reader/useFocusedResource';
import { useOpenVerse } from '@/features/reader/useOpenVerse';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';

export default function ChaptersRoute() {
  const repository = useReaderRepository();
  const language = useReaderStore((state) => state.language);
  const colors = usePalette();
  const router = useRouter();
  const { openVerse, opening, error: openError } = useOpenVerse();
  const load = useCallback(async () => {
    const [chapters, metadata, progress] = await Promise.all([
      repository.getChapters(),
      repository.validateContent(),
      repository.getProgress(),
    ]);
    const resume = progress
      ? await repository.getVerse(progress, language)
      : null;
    return { chapters, sample: metadata.sample, resume };
  }, [repository, language]);
  const { data, error, retry } = useFocusedResource(load);
  if (error)
    return (
      <StateScreen message="We couldn’t load your chapters." retry={retry} />
    );
  if (!data) return <StateScreen message="Opening chapters…" loading />;
  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <FlatList
        data={data.chapters}
        keyExtractor={(chapter) => String(chapter.number)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.text }]}
            >
              Find your place.
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              {data.sample
                ? `Sample library · ${data.chapters.length} chapters represented. Only bundled sample verses are available.`
                : 'Browse the chapters or continue where you left off.'}
            </Text>
            {data.resume && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Resume reading at verse ${data.resume.ref}`}
                disabled={opening}
                onPress={() => void openVerse(data.resume!.ref)}
                style={[styles.resume, { backgroundColor: colors.surface }]}
              >
                <Text style={{ color: colors.accent }}>
                  Resume at {data.resume.ref} →
                </Text>
              </Pressable>
            )}
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
            No chapters are available in this content release.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Browse chapter ${item.number}, ${item.available_verses} available verses`}
            onPress={() =>
              router.push({
                pathname: '/chapters/[number]',
                params: { number: String(item.number) },
              })
            }
            style={[styles.chapter, { borderBottomColor: colors.border }]}
          >
            <Text style={[styles.number, { color: colors.accent }]}>
              {String(item.number).padStart(2, '0')}
            </Text>
            <View style={{ flex: 1, gap: 8 }}>
              <Text style={[styles.chapterTitle, { color: colors.text }]}>
                {item.title}
              </Text>
              <Text style={[styles.body, { color: colors.muted }]}>
                {data.sample
                  ? `${item.available_verses} of ${item.verse_count} verses available as samples`
                  : `${item.available_verses} verses`}
              </Text>
            </View>
            <Text style={{ color: colors.muted }}>→</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  intro: { gap: 18, paddingVertical: 24 },
  title: { fontSize: 29, fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 23 },
  resume: {
    minHeight: 48,
    padding: 16,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  chapter: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingVertical: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  number: { fontSize: 23, minWidth: 36 },
  chapterTitle: { fontSize: 19, lineHeight: 27 },
});
