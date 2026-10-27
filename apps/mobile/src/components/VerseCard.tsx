import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { Verse } from '@/repositories/reader';
import { usePalette } from '@/theme';
import { BookmarkButton } from '@/components/BookmarkButton';
import { VerseTransliteration } from '@/components/VerseTransliteration';
import { useReaderTypography } from '@/theme/typography';

export function VerseCard({
  verse,
  height,
  largeText,
  sample = false,
}: {
  verse: Verse;
  height: number;
  largeText: boolean;
  sample?: boolean;
}) {
  const colors = usePalette();
  const typography = useReaderTypography();
  const router = useRouter();
  const [contentHeight, setContentHeight] = useState(0);
  return (
    <View style={{ height, width: '100%' }}>
      <ScrollView
        nestedScrollEnabled
        directionalLockEnabled
        bounces={false}
        scrollEnabled={contentHeight > height + 1}
        onContentSizeChange={(_, measuredHeight) =>
          setContentHeight(measuredHeight)
        }
        contentContainerStyle={[styles.content, { minHeight: height }]}
        showsVerticalScrollIndicator={largeText || contentHeight > height + 1}
        accessibilityHint="Scroll within this verse to read overflowing text. Use Previous and Next below the feed to change verses."
      >
        <Text
          style={[styles.eyebrow, { color: colors.muted }]}
        >{`CHAPTER ${verse.chapter_number} · VERSE ${verse.verse_number}`}</Text>
        <Text
          accessibilityLabel={`${sample ? 'Sanskrit placeholder for reference' : 'Sanskrit, verse'} ${verse.ref}: ${verse.sanskrit}`}
          style={[styles.sanskrit, typography.sanskrit, { color: colors.text }]}
        >
          {verse.sanskrit}
        </Text>
        <VerseTransliteration
          verseRef={verse.ref}
          text={verse.transliteration}
        />
        <View style={[styles.divider, { backgroundColor: colors.accent }]} />
        <Text
          style={[
            styles.translation,
            typography.translation,
            { color: colors.text },
          ]}
        >
          {verse.translation}
        </Text>
        <Text style={[styles.reference, { color: colors.muted }]}>
          GITA · {verse.ref}
        </Text>
        <View style={styles.actions}>
          <BookmarkButton verseRef={verse.ref} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open verse details for ${verse.ref}`}
            onPress={() =>
              router.push({
                pathname: '/study/[ref]',
                params: { ref: verse.ref },
              })
            }
            style={[styles.study, { borderColor: colors.border }]}
          >
            <Text style={{ color: colors.accent }}>
              {sample ? 'View sample details' : 'Study this verse'} ↗
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 32,
  },
  sanskrit: {
    textAlign: 'center',
    fontWeight: '500',
  },
  divider: { height: 1, width: 36, marginVertical: 28 },
  translation: { textAlign: 'center' },
  reference: { fontSize: 11, letterSpacing: 2, marginTop: 28 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
  },
  study: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
