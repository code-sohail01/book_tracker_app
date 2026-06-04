import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
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
  const isDark = useColorScheme() === 'dark';

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
                backgroundColor: isDark ? '#151D2E' : Colors.surface,
                borderColor: isDark ? '#334155' : Colors.border,
              },
              selected && styles.segmentSelected,
            ]}>
            <Text
              style={[
                styles.segmentText,
                { color: isDark ? '#94A3B8' : Colors.textMuted },
                selected && styles.segmentTextSelected,
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
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  segment: {
    width: '48%',
    flexGrow: 1,
    flexBasis: '46%',
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextSelected: {
    color: Colors.primary,
  },
});
