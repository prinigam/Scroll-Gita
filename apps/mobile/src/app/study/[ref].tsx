import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StateScreen } from '@/components/StateScreen';
import type { Verse } from '@/repositories/reader';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';
import { BookmarkButton } from '@/components/BookmarkButton';
import { VerseTransliteration } from '@/components/VerseTransliteration';
import { useReaderTypography } from '@/theme/typography';

export default function VerseDetails() {
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const repository = useReaderRepository();
  const language = useReaderStore((state) => state.language);
  const colors = usePalette();
  const typography = useReaderTypography();
  const [result, setResult] = useState<{
    verse: Verse | null;
    sample: boolean;
  } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([
      repository.getVerse(ref, language),
      repository.validateContent(),
    ])
      .then(([verse, metadata]) => {
        if (active) setResult({ verse, sample: metadata.sample });
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [repository, ref, language]);
  if (error)
    return (
      <StateScreen message="We couldn’t open these verse details. Go back to return to your reader." />
    );
  if (!result) return <StateScreen message="Opening verse details…" loading />;
  if (!result.verse)
    return (
      <StateScreen message="This reference is not available in your offline library." />
    );
  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.reference, { color: colors.accent }]}>
          CHAPTER {result.verse.chapter_number} · VERSE{' '}
          {result.verse.verse_number}
        </Text>
        {result.sample && (
          <Text
            accessibilityRole="alert"
            style={[
              styles.notice,
              { color: colors.accent, backgroundColor: colors.surface },
            ]}
          >
            Layout sample · not scripture or a translation
          </Text>
        )}
        <Text style={[typography.sanskrit, { color: colors.text }]}>
          {result.verse.sanskrit}
        </Text>
        <VerseTransliteration
          verseRef={result.verse.ref}
          text={result.verse.transliteration}
          align="left"
        />
        <Text style={[typography.translation, { color: colors.text }]}>
          {result.verse.translation}
        </Text>
        <View style={{ alignItems: 'flex-start' }}>
          <BookmarkButton verseRef={result.verse.ref} />
        </View>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.text }]}
        >
          Deep Study
        </Text>
        <Text style={[typography.body, { color: colors.muted }]}>
          Reviewed meaning, Sanskrit terms, context, practical application, and
          related verses will appear here after content approval. No explanation
          has been generated for this preview.
        </Text>
        {result.sample && (
          <Text style={[typography.body, { color: colors.muted }]}>
            Source: original non-scriptural layout fixtures, Scroll Gita
            project, version 1, CC0-1.0.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  content: { padding: 28, gap: 28 },
  reference: { fontSize: 11, letterSpacing: 2 },
  notice: { fontSize: 13, lineHeight: 21, padding: 16, borderRadius: 12 },
  title: { fontSize: 25, fontWeight: '600', marginTop: 8 },
});
