import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { ShelfBook } from '@/types/library';

type LogProgressModalProps = {
  visible: boolean;
  book: ShelfBook | null;
  onClose: () => void;
  onSubmit: (pagesRead: number) => Promise<void>;
};

export default function LogProgressModal({
  visible,
  book,
  onClose,
  onSubmit,
}: LogProgressModalProps) {
  const { theme } = useTheme();
  const { colors, radius } = theme;
  const [pages, setPages] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setPages('');
  }, [visible, book?.bookId]);

  const handleSave = async () => {
    const value = parseInt(pages, 10);
    if (!value || value < 1) return;
    setSaving(true);
    try {
      await onSubmit(value);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
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
              Log progress
            </Text>
            <Text
              style={[styles.subtitle, font('regular'), { color: colors.textMuted }]}
              numberOfLines={2}>
              {book?.title ?? 'Book'}
            </Text>

            <Text style={[styles.label, font('bold'), { color: colors.textMuted }]}>
              Pages read today
            </Text>
            <TextInput
              style={[
                styles.input,
                font('semiBold'),
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
              ]}
              value={pages}
              onChangeText={setPages}
              keyboardType="number-pad"
              placeholder="e.g. 24"
              placeholderTextColor={colors.textMuted}
            />

            <Pressable
              style={[
                styles.primary,
                { backgroundColor: colors.primary, borderRadius: radius.md },
                saving && styles.primaryDisabled,
              ]}
              onPress={handleSave}
              disabled={saving || !pages.trim()}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.primaryText, font('bold')]}>Save progress</Text>
              )}
            </Pressable>

            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={[styles.cancelText, font('semiBold'), { color: colors.textMuted }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboard: { width: '100%' },
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
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    marginBottom: 24,
  },
  primary: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryDisabled: { opacity: 0.65 },
  primaryText: { color: '#fff', fontSize: 16 },
  cancel: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelText: { fontSize: 15 },
});
