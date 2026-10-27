import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useReaderRepository } from '@/services/reader-context';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';

export function BookmarkButton({ verseRef }: { verseRef: string }) {
  const colors = usePalette();
  const repository = useReaderRepository();
  const saved = useReaderStore((state) =>
    state.bookmarkRefs.includes(verseRef),
  );
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const toggle = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(false);
    try {
      await repository.setBookmark(verseRef, !saved);
      const refs = await repository.getBookmarkRefs();
      useReaderStore.getState().setBookmarkRefs(refs);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${saved ? 'Remove bookmark for' : 'Bookmark'} verse ${verseRef}`}
        accessibilityState={{
          selected: saved,
          busy: pending,
          disabled: pending,
        }}
        disabled={pending}
        onPress={() => void toggle()}
        style={[
          styles.button,
          {
            borderColor: colors.border,
            backgroundColor: saved ? colors.surface : undefined,
          },
        ]}
      >
        <Text style={{ color: colors.accent }}>
          {pending ? 'Saving…' : saved ? 'Saved ✓' : 'Save verse'}
        </Text>
      </Pressable>
      {error && (
        <Text
          accessibilityRole="alert"
          style={[styles.error, { color: colors.accent }]}
        >
          Couldn’t update saved verses. Tap again to retry.
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  button: {
    minHeight: 48,
    minWidth: 88,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 13, lineHeight: 20, maxWidth: 260, textAlign: 'center' },
});
