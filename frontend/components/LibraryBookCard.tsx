import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import type { ShelfBook } from '@/types/library';

const COVER_HEIGHT = 168;

type LibraryBookCardProps = {
  book: ShelfBook;
  width: number;
  selected?: boolean;
  selectionMode?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
};

export default function LibraryBookCard({
  book,
  width,
  selected = false,
  selectionMode = false,
  onPress,
  onLongPress,
}: LibraryBookCardProps) {
  const { theme } = useTheme();
  const { colors, radius, shadow } = theme;

  const cover =
    book.coverUrl?.replace('http://', 'https://') ||
    'https://via.placeholder.com/150x220?text=No+Cover';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          width,
          borderRadius: radius.md,
          backgroundColor: colors.border,
          ...shadow.card,
        },
        selected && { borderWidth: 3, borderColor: colors.primary },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}>
      <Image source={{ uri: cover }} style={styles.cover} />
      <View style={styles.shine} />
      {selectionMode ? (
        <View
          style={[
            styles.check,
            selected && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}>
          {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: COVER_HEIGHT,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  shine: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(15,23,42,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
