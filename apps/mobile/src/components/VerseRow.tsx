import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Verse } from '@/repositories/reader';
import { usePalette } from '@/theme';

export function VerseRow({
  verse,
  disabled,
  onPress,
}: {
  verse: Verse;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Read verse ${verse.ref}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.row, { borderColor: colors.border }]}
    >
      <View style={[styles.badge, { backgroundColor: colors.surface }]}>
        <Text style={{ color: colors.accent }}>{verse.ref}</Text>
      </View>
      <Text numberOfLines={3} style={[styles.preview, { color: colors.text }]}>
        {verse.translation}
      </Text>
      <Text style={{ color: colors.muted }}>↗</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 88,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    minWidth: 52,
    minHeight: 44,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: { flex: 1, fontSize: 17, lineHeight: 26 },
});
