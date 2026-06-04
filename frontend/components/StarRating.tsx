import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';

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
  return (
    <View style={styles.row}>
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
              color={filled ? '#F59E0B' : Colors.border}
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
    gap: theme.spacing.sm,
  },
  star: {
    padding: 2,
  },
});
