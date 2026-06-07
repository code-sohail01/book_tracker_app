import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
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
  const { theme } = useTheme();
  const { colors, spacing, radius, shadow } = theme;

  const info = book.volumeInfo;
  const cover =
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail ??
    'https://via.placeholder.com/120x180?text=No+Cover';
  const year = getPublishedYear(book);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Open ${info.title ?? 'book'} details`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.md,
          marginBottom: spacing.md,
          ...shadow.card,
        },
        pressed && styles.cardPressed,
      ]}
      disabled={!onPress}>
      <Image
        source={{ uri: cover.replace('http://', 'https://') }}
        style={[styles.cover, { borderRadius: radius.sm, backgroundColor: colors.border }]}
      />
      <View style={[styles.body, { marginLeft: spacing.md, marginRight: spacing.sm }]}>
        <Text style={[styles.title, font('bold'), { color: colors.text }]} numberOfLines={2}>
          {info.title ?? 'Untitled'}
        </Text>
        <Text
          style={[styles.author, font('regular'), { color: colors.textMuted }]}
          numberOfLines={1}>
          {(info.authors ?? []).join(', ') || 'Unknown author'}
        </Text>
        {year ? (
          <Text style={[styles.year, font('medium'), { color: colors.textMuted }]}>{year}</Text>
        ) : null}
      </View>
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel="Quick add to library"
          style={({ pressed }) => [
            styles.addButton,
            {
              backgroundColor: colors.primary,
              ...shadow.card,
            },
            pressed && { backgroundColor: colors.primaryDark },
            isAdding && styles.addButtonDisabled,
          ]}
          disabled={isAdding}
          hitSlop={8}>
          {isAdding ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <Ionicons name="add" size={22} color={colors.surface} />
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
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  cover: {
    width: 56,
    height: 84,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
  },
  author: {
    fontSize: 14,
    marginTop: 4,
  },
  year: {
    fontSize: 13,
    marginTop: 6,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: {
    opacity: 0.75,
  },
});
