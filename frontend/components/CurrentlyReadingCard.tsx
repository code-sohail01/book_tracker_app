import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
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
        { width: cardWidth },
        pressed && styles.pressed,
      ]}>
      <View style={styles.row}>
        <Image source={{ uri: cover }} style={styles.cover} />
        <View style={styles.meta}>
          <Text style={styles.title} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {(book.authors ?? []).join(', ') || 'Unknown author'}
          </Text>
        </View>
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>{percent}% complete</Text>
          {total > 0 ? (
            <Text style={styles.pageText}>
              {current} / {total} pages
            </Text>
          ) : (
            <Text style={styles.pageText}>Keep logging pages</Text>
          )}
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logButton, pressed && styles.logButtonPressed]}
        onPress={onLogProgress}
        hitSlop={6}>
        <Ionicons name="create-outline" size={16} color={Colors.primary} />
        <Text style={styles.logButtonText}>Log Progress</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...theme.shadow.card,
  },
  pressed: { opacity: 0.96 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cover: {
    width: 72,
    height: 108,
    borderRadius: theme.radius.sm,
    backgroundColor: Colors.border,
    ...theme.shadow.card,
  },
  meta: {
    flex: 1,
    marginLeft: theme.spacing.md,
    justifyContent: 'center',
    minHeight: 108,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  author: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 6,
  },
  progressBlock: {
    marginTop: theme.spacing.md,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  pageText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  track: {
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: Colors.primary,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  logButtonPressed: {
    backgroundColor: '#DBEAFE',
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
