import { StyleSheet, Text, View } from 'react-native';

import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { MonthBucket } from '@/utils/statsAnalytics';

const CHART_HEIGHT = 168;
const MIN_BAR_HEIGHT = 6;

type StatsBarChartProps = {
  data: MonthBucket[];
};

export default function StatsBarChart({ data }: StatsBarChartProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <View style={styles.wrap}>
      <View style={[styles.chartArea, { height: CHART_HEIGHT }]}>
        {data.map((bucket) => {
          const heightRatio = bucket.count / maxCount;
          const barHeight = Math.max(
            MIN_BAR_HEIGHT,
            Math.round(CHART_HEIGHT * heightRatio),
          );

          return (
            <View key={bucket.key} style={styles.barColumn}>
              <Text style={[styles.barValue, font('bold'), { color: colors.textMuted }]}>
                {bucket.count > 0 ? bucket.count : ''}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor:
                        bucket.count > 0 ? colors.primary : colors.border,
                      opacity: bucket.count > 0 ? 1 : 0.55,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, font('semiBold'), { color: colors.textMuted }]}>
                {bucket.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barValue: {
    fontSize: 11,
    marginBottom: 4,
    minHeight: 14,
  },
  barTrack: {
    width: '100%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '72%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 11,
  },
});
