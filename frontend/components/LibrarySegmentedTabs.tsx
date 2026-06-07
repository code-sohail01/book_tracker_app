import { Pressable, StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { BookStatus } from '@/types/library';

export type LibraryTab = { key: BookStatus; label: string; short: string };

type LibrarySegmentedTabsProps = {
  tabs: LibraryTab[];
  active: BookStatus;
  onChange: (status: BookStatus) => void;
};

export default function LibrarySegmentedTabs({
  tabs,
  active,
  onChange,
}: LibrarySegmentedTabsProps) {
  const { theme } = useTheme();
  const { colors, radius } = theme;

  return (
    <View style={styles.grid}>
      {tabs.map((tab) => {
        const selected = active === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.segment,
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
                styles.segmentText,
                font('semiBold'),
                { color: colors.textMuted },
                selected && { color: colors.primary },
              ]}
              numberOfLines={1}>
              {tab.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  segment: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    paddingVertical: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
  },
});
