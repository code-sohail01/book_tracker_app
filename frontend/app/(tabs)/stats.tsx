import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GenreBreakdown from '@/components/stats/GenreBreakdown';
import StatsBarChart from '@/components/stats/StatsBarChart';
import { font } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchMyBooks } from '@/services/booksApi';
import type { ShelfBook } from '@/types/library';
import {
  computeBooksPerMonth,
  computeLibraryBreakdown,
  computeLifetimeStats,
} from '@/utils/statsAnalytics';

export default function StatsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { colors, spacing, radius, shadow } = theme;

  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const shelf = await fetchMyBooks();
      setBooks(shelf);
    } catch (error) {
      Alert.alert(
        'Could not load statistics',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const lifetime = useMemo(() => computeLifetimeStats(books), [books]);
  const monthly = useMemo(() => computeBooksPerMonth(books, 6), [books]);
  const breakdown = useMemo(() => computeLibraryBreakdown(books), [books]);
  const breakdownUsesGenres = breakdown.some(
    (slice) =>
      !['Finished', 'Currently Reading', 'Read Later', 'Did Not Finish'].includes(
        slice.label,
      ),
  );

  if (loading && books.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStats(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, font('bold'), { color: colors.textMuted }]}>
            Statistics
          </Text>
          <Text style={[styles.title, font('extraBold'), { color: colors.text }]}>
            {user ? `${user}'s insights` : 'Your insights'}
          </Text>
          <Text style={[styles.subtitle, font('regular'), { color: colors.textMuted }]}>
            Lifetime reading performance across your library
          </Text>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.heroBottom,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadow.card,
            },
          ]}>
          <View
            style={[styles.heroGlow, { backgroundColor: colors.heroTop }]}
          />
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <View style={styles.heroIcon}>
                <Ionicons name="library" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.heroValue, font('extraBold'), { color: colors.text }]}>
                {lifetime.totalBooksRead}
              </Text>
              <Text style={[styles.heroLabel, font('semiBold'), { color: colors.textMuted }]}>
                Total Books Read
              </Text>
            </View>

            <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroStat}>
              <View style={styles.heroIcon}>
                <Ionicons name="document-text" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.heroValue, font('extraBold'), { color: colors.text }]}>
                {lifetime.totalPagesRead.toLocaleString()}
              </Text>
              <Text style={[styles.heroLabel, font('semiBold'), { color: colors.textMuted }]}>
                Total Pages Read
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadow.card,
            },
          ]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, font('extraBold'), { color: colors.text }]}>
              Books per month
            </Text>
            <Text style={[styles.sectionHint, font('medium'), { color: colors.textMuted }]}>
              Last 6 months · finished titles
            </Text>
          </View>
          <StatsBarChart data={monthly} />
        </View>

        <View
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.xl,
              ...shadow.card,
            },
          ]}>
          <GenreBreakdown
            title={breakdownUsesGenres ? 'Top genres' : 'Library breakdown'}
            subtitle={
              breakdownUsesGenres
                ? 'Inferred from your saved titles and tags'
                : 'How your shelf is distributed by status'
            }
            data={breakdown}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  heroCard: {
    marginHorizontal: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    opacity: 0.9,
  },
  heroRow: {
    flexDirection: 'row',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37,99,235,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroValue: {
    fontSize: 40,
    letterSpacing: -1.2,
  },
  heroLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  heroDivider: {
    width: 1,
    marginVertical: 8,
  },
  sectionCard: {
    marginHorizontal: 24,
    marginTop: 24,
    borderWidth: 1,
    padding: 24,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 13,
    marginTop: 4,
  },
});
