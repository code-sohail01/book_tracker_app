import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
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
  const cover =
    book.coverUrl?.replace('http://', 'https://') ||
    'https://via.placeholder.com/150x220?text=No+Cover';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width },
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}>
      <Image source={{ uri: cover }} style={styles.cover} />
      <View style={styles.shine} />
      {selectionMode ? (
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: COVER_HEIGHT,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: Colors.border,
    ...theme.shadow.card,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: Colors.primary,
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
  checkSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
