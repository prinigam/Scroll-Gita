import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReaderTextSize, ThemePreference } from '@scroll-gita/storage';
import { usePreferenceActions } from '@/features/settings/usePreferenceActions';
import { useReaderStore } from '@/store/reader';
import { usePalette } from '@/theme';
import { useReaderTypography } from '@/theme/typography';

function Choice({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const colors = usePalette();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.choice,
        {
          backgroundColor: selected ? colors.surface : colors.background,
          borderColor: selected ? colors.accent : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.choiceText,
          { color: selected ? colors.accent : colors.text },
        ]}
      >
        {label}
        {selected ? ' ✓' : ''}
      </Text>
    </Pressable>
  );
}

const themes: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];
const sizes: { label: string; value: ReaderTextSize }[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Large', value: 'large' },
  { label: 'Extra large', value: 'extraLarge' },
];

export default function SettingsRoute() {
  const colors = usePalette();
  const typography = useReaderTypography();
  const language = useReaderStore((state) => state.language);
  const theme = useReaderStore((state) => state.theme);
  const textSize = useReaderStore((state) => state.textSize);
  const showTransliteration = useReaderStore(
    (state) => state.showTransliteration,
  );
  const { save, pending, error } = usePreferenceActions();
  const disabled = pending !== null;
  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.title, { color: colors.text }]}
          >
            Make room for your reading.
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Your preferences are saved on this device and work offline.
          </Text>
          {pending && (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.body, { color: colors.muted }]}
            >
              Saving your preference…
            </Text>
          )}
          {error && (
            <Text
              accessibilityRole="alert"
              style={[styles.body, { color: colors.accent }]}
            >
              Couldn’t save this change. Your previous preference is still
              selected. Tap your choice again to retry.
            </Text>
          )}
        </View>
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.text }]}
          >
            Translation language
          </Text>
          <View style={styles.choices}>
            <Choice
              label="English"
              selected={language === 'en'}
              disabled={disabled}
              onPress={() => void save('language', 'en')}
            />
            <Choice
              label="हिन्दी"
              selected={language === 'hi'}
              disabled={disabled}
              onPress={() => void save('language', 'hi')}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.text }]}
          >
            Appearance
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            System follows your phone’s light or dark appearance.
          </Text>
          <View style={styles.choices}>
            {themes.map((option) => (
              <Choice
                key={option.value}
                label={option.label}
                selected={theme === option.value}
                disabled={disabled}
                onPress={() => void save('theme', option.value)}
              />
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.text }]}
          >
            Verse text size
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Applies to Sanskrit, transliteration, and reading text. Your phone’s
            accessibility text size also applies.
          </Text>
          <View style={styles.choices}>
            {sizes.map((option) => (
              <Choice
                key={option.value}
                label={option.label}
                selected={textSize === option.value}
                disabled={disabled}
                onPress={() => void save('textSize', option.value)}
              />
            ))}
          </View>
          <View style={[styles.preview, { backgroundColor: colors.surface }]}>
            <Text style={[styles.caption, { color: colors.muted }]}>
              TEXT SIZE PREVIEW · LAYOUT EXAMPLE
            </Text>
            <Text style={[typography.sanskrit, { color: colors.text }]}>
              पाठ के आकार का नमूना
            </Text>
            <Text style={[typography.translation, { color: colors.text }]}>
              Space to read, one line at a time.
            </Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.text }]}
          >
            Transliteration
          </Text>
          <View style={styles.switchRow}>
            <Text style={[styles.body, { color: colors.text, flex: 1 }]}>
              Show transliteration
            </Text>
            <Switch
              accessibilityLabel="Show transliteration"
              accessibilityHint="Displays transliteration beneath the Sanskrit when it is available."
              value={showTransliteration}
              onValueChange={(value) => void save('showTransliteration', value)}
              disabled={disabled}
              trackColor={{ false: colors.border, true: colors.accent }}
            />
          </View>
          <Text style={[styles.body, { color: colors.muted }]}>
            Shown in the feed and verse details when supplied by the content
            source. The current preview contains placeholder text.
          </Text>
        </View>
        <View style={[styles.readingHint, { borderColor: colors.border }]}>
          <Text
            accessibilityRole="header"
            style={[styles.heading, { color: colors.text }]}
          >
            Reading with larger text
          </Text>
          <Text style={[styles.body, { color: colors.muted }]}>
            Scroll within a verse to read every line. Previous and Next remain
            available below the feed. With VoiceOver or larger combined text
            sizes, use these buttons to change verses.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 32, paddingBottom: 40 },
  section: { gap: 14 },
  title: { fontSize: 28, lineHeight: 38, fontWeight: '500' },
  heading: { fontSize: 19, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 25 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  choice: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    maxWidth: '100%',
  },
  choiceText: { fontSize: 16, lineHeight: 24 },
  preview: { padding: 20, borderRadius: 18, gap: 18 },
  caption: { fontSize: 10, lineHeight: 17, letterSpacing: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 48,
  },
  readingHint: { padding: 20, borderRadius: 16, gap: 12, borderWidth: 1 },
});
