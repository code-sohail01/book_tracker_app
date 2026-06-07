import { StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { GenreSlice } from '@/utils/statsAnalytics';

type GenreBreakdownProps = {
  title: string;
  subtitle: string;
  data: GenreSlice[];
};

const BAR_COLORS = ['#2563EB', '#3B82F6', '#6366F1', '#0EA5E9', '#14B8A6'];

export default function GenreBreakdown({
  title,
  subtitle,
  data,
}: GenreBreakdownProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;

  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, font('regular'), { color: colors.textMuted }]}>
          Add more books to see your library breakdown.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.title, font('extraBold'), { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, font('regular'), { color: colors.textMuted }]}>
        {subtitle}
      </Text>

      {data.map((slice, index) => (
        <View key={slice.label} style={styles.row}>
          <View style={styles.rowHeader}>
            <Text style={[styles.label, font('bold'), { color: colors.text }]}>
              {slice.label}
            </Text>
            <Text style={[styles.percent, font('semiBold'), { color: colors.textMuted }]}>
              {slice.percent}% · {slice.count} {slice.count === 1 ? 'book' : 'books'}
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.border, borderRadius: radius.pill }]}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(slice.percent, 4)}%`,
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                  borderRadius: radius.pill,
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
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    marginBottom: 16,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    fontSize: 15,
    flex: 1,
  },
  percent: {
    fontSize: 12,
  },
  track: {
    height: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
