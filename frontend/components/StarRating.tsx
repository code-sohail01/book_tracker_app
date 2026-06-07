import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

type StarRatingProps = {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
};

export default function StarRating({
  value,
  onChange,
  size = 36,
}: StarRatingProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <Pressable
            key={star}
            onPress={() => onChange(star === value ? 0 : star)}
            hitSlop={8}
            style={styles.star}>
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={size}
              color={filled ? '#F59E0B' : colors.border}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    padding: 2,
  },
});
