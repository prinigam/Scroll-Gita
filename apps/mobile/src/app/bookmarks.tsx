import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookmarkButton } from '@/components/BookmarkButton';
import { StateScreen } from '@/components/StateScreen';
import { VerseRow } from '@/components/VerseRow';
import { useFocusedResource } from '@/features/reader/useFocusedResource';
import { useOpenVerse } from '@/features/reader/useOpenVerse';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';

export default function BookmarksRoute() {
  const repository = useReaderRepository();
  const language = useReaderStore((state) => state.language);
  const refs = useReaderStore((state) => state.bookmarkRefs);
  const colors = usePalette();
  const { openVerse, opening, error: openError } = useOpenVerse();
  const load = useCallback(async () => {
    const [bookmarks, metadata] = await Promise.all([
      repository.getBookmarks(language),
      repository.validateContent(),
    ]);
    return { bookmarks, sample: metadata.sample };
  }, [repository, language]);
  const { data, error, retry } = useFocusedResource(load, refs);
  if (error)
    return (
      <StateScreen
        message="We couldn’t load your saved verses."
        retry={retry}
      />
    );
  if (!data) return <StateScreen message="Opening saved verses…" loading />;
  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <FlatList
        data={data.bookmarks}
        keyExtractor={(bookmark) => bookmark.verse_ref}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.intro}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: colors.text }]}
            >
              Keep what stays with you.
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              {data.sample
                ? 'Saved sample verses · stored only on this device.'
                : 'Your saved verses, available offline on this device.'}
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
          <View style={[styles.empty, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No saved verses yet
            </Text>
            <Text style={[styles.body, { color: colors.muted }]}>
              Tap “Save verse” in the reader or verse details. Your bookmarks
              will appear here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.bookmark}>
            {item.verse ? (
              <VerseRow
                verse={item.verse}
                disabled={opening}
                onPress={() => void openVerse(item.verse_ref)}
              />
            ) : (
              <Text style={[styles.body, { color: colors.muted }]}>
                Verse {item.verse_ref} is unavailable in this content release.
                Your bookmark has been kept.
              </Text>
            )}
            <View style={{ alignItems: 'flex-start' }}>
              <BookmarkButton verseRef={item.verse_ref} />
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  list: { paddingHorizontal: 24, paddingBottom: 32 },
  intro: { gap: 16, paddingVertical: 24 },
  title: { fontSize: 27, lineHeight: 37, fontWeight: '500' },
  body: { fontSize: 15, lineHeight: 24 },
  empty: { padding: 24, borderRadius: 18, gap: 12, marginTop: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '500' },
  bookmark: { paddingBottom: 20, gap: 14 },
});
