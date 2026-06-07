import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { BOOK_STATUS_OPTIONS, type BookStatus } from '@/types/library';

type StatusPickerProps = {
  value: BookStatus;
  onChange: (status: BookStatus) => void;
};

export default function StatusPicker({ value, onChange }: StatusPickerProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, font('bold'), { color: colors.textMuted }]}>
        Reading status
      </Text>
      <View style={[styles.grid, { gap: spacing.sm }]}>
        {BOOK_STATUS_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                },
                selected && {
                  backgroundColor: colors.chipSelectedBg,
                  borderColor: colors.chipSelectedBorder,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  font('semiBold'),
                  { color: colors.textMuted },
                  selected && { color: colors.primary },
                ]}
                numberOfLines={2}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chip: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  chipText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
