import { Modal, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import { BOOK_STATUS_OPTIONS, type BookStatus } from '@/types/library';

type WhereToModalProps = {
  visible: boolean;
  bookTitle?: string;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  onSelect: (status: BookStatus) => void;
};

export default function WhereToModal({
  visible,
  bookTitle,
  title = 'Where to?',
  subtitle,
  onClose,
  onSelect,
}: WhereToModalProps) {
  const isDark = useColorScheme() === 'dark';

  const sheet = isDark ? '#151D2E' : Colors.surface;
  const text = isDark ? '#F8FAFC' : Colors.text;
  const muted = isDark ? '#94A3B8' : Colors.textMuted;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={[styles.sheet, { backgroundColor: sheet }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: muted }]} numberOfLines={2}>
            {subtitle ??
              (bookTitle ? `Add “${bookTitle}” to your library as…` : 'Choose a shelf')}
          </Text>

          {BOOK_STATUS_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: isDark ? '#334155' : Colors.border,
                },
                pressed && styles.optionPressed,
              ]}
              onPress={() => onSelect(option.value)}>
              <Text style={[styles.optionText, { color: text }]}>{option.label}</Text>
            </Pressable>
          ))}

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={[styles.cancelText, { color: muted }]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  option: {
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  optionPressed: { opacity: 0.88 },
  optionText: { fontSize: 16, fontWeight: '700' },
  cancel: { alignItems: 'center', paddingTop: theme.spacing.md },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
