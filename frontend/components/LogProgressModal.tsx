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
  useColorScheme,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
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
  const isDark = useColorScheme() === 'dark';
  const [pages, setPages] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) setPages('');
  }, [visible, book?.bookId]);

  const palette = isDark
    ? { sheet: '#151D2E', text: '#F8FAFC', muted: '#94A3B8', input: '#1E293B' }
    : { sheet: Colors.surface, text: Colors.text, muted: Colors.textMuted, input: '#F8FAFC' };

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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          <View style={[styles.sheet, { backgroundColor: palette.sheet }]}>
            <View style={styles.handle} />
            <Text style={[styles.title, { color: palette.text }]}>Log progress</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]} numberOfLines={2}>
              {book?.title ?? 'Book'}
            </Text>

            <Text style={[styles.label, { color: palette.muted }]}>Pages read today</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: palette.input,
                  color: palette.text,
                  borderColor: isDark ? '#334155' : Colors.border,
                },
              ]}
              value={pages}
              onChangeText={setPages}
              keyboardType="number-pad"
              placeholder="e.g. 24"
              placeholderTextColor={palette.muted}
            />

            <Pressable
              style={[styles.primary, saving && styles.primaryDisabled]}
              onPress={handleSave}
              disabled={saving || !pages.trim()}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryText}>Save progress</Text>
              )}
            </Pressable>

            <Pressable onPress={onClose} style={styles.cancel}>
              <Text style={[styles.cancelText, { color: palette.muted }]}>Cancel</Text>
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
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  keyboard: { width: '100%' },
  sheet: {
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    ...theme.shadow.card,
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
  },
  primary: {
    backgroundColor: Colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryDisabled: { opacity: 0.65 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancel: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
