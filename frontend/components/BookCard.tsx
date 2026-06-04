import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import type { GoogleBookVolume } from '@/types/books';
import { getPublishedYear } from '@/types/books';

type BookCardProps = {
  book: GoogleBookVolume;
  onPress?: () => void;
  onAdd?: () => void;
  isAdding?: boolean;
};

export default function BookCard({
  book,
  onPress,
  onAdd,
  isAdding = false,
}: BookCardProps) {
  const info = book.volumeInfo;
  const cover =
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail ??
    'https://via.placeholder.com/120x180?text=No+Cover';
  const year = getPublishedYear(book);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${info.title ?? 'book'} details`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      disabled={!onPress}>
      <Image source={{ uri: cover.replace('http://', 'https://') }} style={styles.cover} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {info.title ?? 'Untitled'}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          {(info.authors ?? []).join(', ') || 'Unknown author'}
        </Text>
        {year ? <Text style={styles.year}>{year}</Text> : null}
      </View>
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Quick add to library"
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
            isAdding && styles.addButtonDisabled,
          ]}
          disabled={isAdding}
          hitSlop={8}>
          {isAdding ? (
            <ActivityIndicator size="small" color={Colors.surface} />
          ) : (
            <Ionicons name="add" size={22} color={Colors.surface} />
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...theme.shadow.card,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  cover: {
    width: 56,
    height: 84,
    borderRadius: theme.radius.sm,
    backgroundColor: Colors.border,
  },
  body: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
  },
  author: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  year: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '500',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow.card,
  },
  addButtonPressed: {
    backgroundColor: Colors.primaryDark,
  },
  addButtonDisabled: {
    opacity: 0.75,
  },
});
