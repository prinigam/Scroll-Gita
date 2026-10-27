import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { usePalette } from '@/theme';

export function StateScreen({
  message,
  loading = false,
  retry,
}: {
  message: string;
  loading?: boolean;
  retry?: () => void;
}) {
  const colors = usePalette();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && (
        <ActivityIndicator
          color={colors.accent}
          accessibilityLabel="Opening offline reader"
        />
      )}
      <Text
        accessibilityRole={retry ? 'alert' : undefined}
        style={[styles.message, { color: colors.text }]}
      >
        {message}
      </Text>
      {retry && (
        <Pressable
          accessibilityRole="button"
          onPress={retry}
          style={[styles.button, { backgroundColor: colors.surface }]}
        >
          <Text style={{ color: colors.accent }}>Try again</Text>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  message: { fontSize: 18, lineHeight: 28, textAlign: 'center' },
  button: { minHeight: 48, padding: 16, borderRadius: 12 },
});
