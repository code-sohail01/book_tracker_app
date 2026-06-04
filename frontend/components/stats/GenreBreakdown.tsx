import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import type { GenreSlice } from '@/utils/statsAnalytics';

type GenreBreakdownProps = {
  title: string;
  subtitle: string;
  data: GenreSlice[];
  isDark: boolean;
};

const BAR_COLORS = [
  Colors.primary,
  '#3B82F6',
  '#6366F1',
  '#0EA5E9',
  '#14B8A6',
];

export default function GenreBreakdown({
  title,
  subtitle,
  data,
  isDark,
}: GenreBreakdownProps) {
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: isDark ? '#94A3B8' : Colors.textMuted }]}>
          Add more books to see your library breakdown.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.title, { color: isDark ? '#F8FAFC' : Colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : Colors.textMuted }]}>
        {subtitle}
      </Text>

      {data.map((slice, index) => (
        <View key={slice.label} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={[styles.label, { color: isDark ? '#F8FAFC' : Colors.text }]}>
              {slice.label}
            </Text>
            <Text style={[styles.percent, { color: isDark ? '#94A3B8' : Colors.textMuted }]}>
              {slice.percent}% · {slice.count} {slice.count === 1 ? 'book' : 'books'}
            </Text>
          </View>
          <View
            style={[
              styles.track,
              { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
            ]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(slice.percent, 4)}%`,
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  row: {
    marginBottom: theme.spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  percent: {
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 12,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
  empty: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
