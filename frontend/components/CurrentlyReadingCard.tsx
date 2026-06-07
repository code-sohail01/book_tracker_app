import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { getReadingProgressPercent } from '@/services/booksApi';
import type { ShelfBook } from '@/types/library';

type CurrentlyReadingCardProps = {
  book: ShelfBook;
  cardWidth: number;
  onLogProgress: () => void;
  onPress?: () => void;
};

export default function CurrentlyReadingCard({
  book,
  cardWidth,
  onLogProgress,
  onPress,
}: CurrentlyReadingCardProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius, shadow } = theme;

  const cover =
    book.coverUrl?.replace('http://', 'https://') ||
    'https://via.placeholder.com/120x180?text=No+Cover';
  const percent = getReadingProgressPercent(book);
  const total = book.totalPages ?? 0;
  const current = book.currentPage ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          width: cardWidth,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginRight: spacing.md,
          ...shadow.card,
        },
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        <Image
          source={{ uri: cover }}
          style={[
            styles.cover,
            { borderRadius: radius.sm, backgroundColor: colors.border },
          ]}
        />
        <View style={[styles.meta, { marginLeft: spacing.md }]}>
          <Text
            style={[styles.title, font('extraBold'), { color: colors.text }]}
            numberOfLines={2}>
            {book.title}
          </Text>
          <Text
            style={[styles.author, font('regular'), { color: colors.textMuted }]}
            numberOfLines={1}>
            {(book.authors ?? []).join(', ') || 'Unknown author'}
          </Text>
        </View>
      </View>

      <View style={[styles.progressBlock, { marginTop: spacing.md }]}>
        <View style={[styles.progressLabels, { marginBottom: spacing.sm }]}>
          <Text style={[styles.progressText, font('bold'), { color: colors.primary }]}>
            {percent}% complete
          </Text>
          {total > 0 ? (
            <Text style={[styles.pageText, font('medium'), { color: colors.textMuted }]}>
              {current} / {total} pages
            </Text>
          ) : (
            <Text style={[styles.pageText, font('medium'), { color: colors.textMuted }]}>
              Keep logging pages
            </Text>
          )}
        </View>
        <View style={[styles.track, { borderRadius: radius.pill, backgroundColor: colors.border }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${percent}%`,
                borderRadius: radius.pill,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.logButton,
          {
            marginTop: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.chipSelectedBg,
            borderColor: colors.chipSelectedBorder,
          },
          pressed && { opacity: 0.88 },
        ]}
        onPress={onLogProgress}
        hitSlop={6}>
        <Ionicons name="create-outline" size={16} color={colors.primary} />
        <Text style={[styles.logButtonText, font('bold'), { color: colors.primary }]}>
          Log Progress
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  pressed: { opacity: 0.96 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cover: {
    width: 72,
    height: 108,
  },
  meta: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 108,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  author: {
    fontSize: 14,
    marginTop: 6,
  },
  progressBlock: {},
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 13,
  },
  pageText: {
    fontSize: 12,
  },
  track: {
    height: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
  },
  logButtonText: {
    fontSize: 14,
  },
});
