import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
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
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, font('extraBold'), { color: colors.text }]}>
            {title}
          </Text>
          <Text
            style={[styles.subtitle, font('regular'), { color: colors.textMuted }]}
            numberOfLines={2}>
            {subtitle ??
              (bookTitle ? `Add “${bookTitle}” to your library as…` : 'Choose a shelf')}
          </Text>

          {BOOK_STATUS_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
                pressed && styles.optionPressed,
              ]}
              onPress={() => onSelect(option.value)}>
              <Text style={[styles.optionText, font('bold'), { color: colors.text }]}>
                {option.label}
              </Text>
            </Pressable>
          ))}

          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={[styles.cancelText, font('semiBold'), { color: colors.textMuted }]}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 6,
    marginBottom: 24,
    lineHeight: 22,
  },
  option: {
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  optionPressed: { opacity: 0.88 },
  optionText: { fontSize: 16 },
  cancel: { alignItems: 'center', paddingTop: 16 },
  cancelText: { fontSize: 15 },
});
