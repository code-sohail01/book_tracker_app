import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import {
  getHeatmapLevel,
  getHeatmapMaxPages,
  getLastNDays,
  type HeatmapData,
} from '@/utils/heatmapAnalytics';

const DEFAULT_DAYS = 90;
const GRID_GAP = 4;
const HORIZONTAL_INSET = 24;
const CARD_PADDING = 16;

type ContributionHeatmapProps = {
  data: HeatmapData;
  days?: number;
};

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function levelOpacity(level: 0 | 1 | 2 | 3 | 4): number {
  switch (level) {
    case 0:
      return 0;
    case 1:
      return 0.28;
    case 2:
      return 0.48;
    case 3:
      return 0.68;
    case 4:
      return 0.92;
    default:
      return 0;
  }
}

export default function ContributionHeatmap({
  data,
  days = DEFAULT_DAYS,
}: ContributionHeatmapProps) {
  const { theme } = useTheme();
  const { colors, radius, shadow } = theme;
  const { width: screenWidth } = useWindowDimensions();

  const dayKeys = useMemo(() => getLastNDays(days), [days]);
  const maxPages = useMemo(() => getHeatmapMaxPages(data, dayKeys), [data, dayKeys]);

  const columns = 15;
  const innerWidth =
    screenWidth - HORIZONTAL_INSET * 2 - CARD_PADDING * 2 - GRID_GAP * (columns - 1);
  const cellSize = Math.floor(innerWidth / columns);

  const totalPages = useMemo(
    () => dayKeys.reduce((sum, key) => sum + (data[key] ?? 0), 0),
    [data, dayKeys],
  );

  const activeDays = useMemo(
    () => dayKeys.filter((key) => (data[key] ?? 0) > 0).length,
    [data, dayKeys],
  );

  return (
    <View
      style={[
        styles.card,
        {
          marginHorizontal: HORIZONTAL_INSET,
          marginTop: 24,
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.xl,
          padding: CARD_PADDING,
          ...shadow.card,
        },
      ]}>
      <View style={styles.header}>
        <Text style={[styles.title, font('extraBold'), { color: colors.text }]}>
          Reading activity
        </Text>
        <Text style={[styles.subtitle, font('regular'), { color: colors.textMuted }]}>
          Last {days} days · {totalPages.toLocaleString()} pages · {activeDays} active days
        </Text>
      </View>

      <View style={[styles.grid, { gap: GRID_GAP }]}>
        {dayKeys.map((dateKey) => {
          const pages = data[dateKey] ?? 0;
          const level = getHeatmapLevel(pages, maxPages);
          const backgroundColor =
            level === 0
              ? colors.inputBg
              : hexToRgba(colors.primary, levelOpacity(level));

          return (
            <View
              key={dateKey}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  borderRadius: Math.max(2, Math.floor(cellSize * 0.22)),
                  backgroundColor,
                  borderWidth: level === 0 ? 1 : 0,
                  borderColor: colors.border,
                },
              ]}
              accessibilityLabel={`${dateKey}: ${pages} pages read`}
            />
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <Text style={[styles.legendLabel, font('medium'), { color: colors.textMuted }]}>
          Less
        </Text>
        {[0, 1, 2, 3, 4].map((level) => {
          const typed = level as 0 | 1 | 2 | 3 | 4;
          const backgroundColor =
            typed === 0
              ? colors.inputBg
              : hexToRgba(colors.primary, levelOpacity(typed));
          return (
            <View
              key={level}
              style={[
                styles.legendCell,
                {
                  backgroundColor,
                  borderWidth: typed === 0 ? 1 : 0,
                  borderColor: colors.border,
                },
              ]}
            />
          );
        })}
        <Text style={[styles.legendLabel, font('medium'), { color: colors.textMuted }]}>
          More
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {},
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 12,
  },
  legendLabel: {
    fontSize: 11,
    marginHorizontal: 2,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
