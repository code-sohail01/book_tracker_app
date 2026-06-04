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
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GenreBreakdown from '@/components/stats/GenreBreakdown';
import StatsBarChart from '@/components/stats/StatsBarChart';
import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { fetchMyBooks } from '@/services/booksApi';
import type { ShelfBook } from '@/types/library';
import {
  computeBooksPerMonth,
  computeLibraryBreakdown,
  computeLifetimeStats,
} from '@/utils/statsAnalytics';

export default function StatsScreen() {
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';

  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const palette = useMemo(
    () =>
      isDark
        ? {
            bg: '#0B1220',
            card: '#151D2E',
            text: '#F8FAFC',
            muted: '#94A3B8',
            heroTop: '#1E3A5F',
            heroBottom: '#151D2E',
            border: '#334155',
          }
        : {
            bg: Colors.background,
            card: Colors.surface,
            text: Colors.text,
            muted: Colors.textMuted,
            heroTop: '#DBEAFE',
            heroBottom: '#EFF6FF',
            border: Colors.border,
          },
    [isDark],
  );

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
      <View style={[styles.centered, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadStats(true)}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: palette.muted }]}>Statistics</Text>
          <Text style={[styles.title, { color: palette.text }]}>
            {user ? `${user}'s insights` : 'Your insights'}
          </Text>
          <Text style={[styles.subtitle, { color: palette.muted }]}>
            Lifetime reading performance across your library
          </Text>
        </View>

        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: palette.heroBottom,
              borderColor: palette.border,
            },
          ]}>
          <View
            style={[
              styles.heroGlow,
              { backgroundColor: palette.heroTop },
            ]}
          />
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <View style={styles.heroIcon}>
                <Ionicons name="library" size={22} color={Colors.primary} />
              </View>
              <Text style={[styles.heroValue, { color: palette.text }]}>
                {lifetime.totalBooksRead}
              </Text>
              <Text style={[styles.heroLabel, { color: palette.muted }]}>
                Total Books Read
              </Text>
            </View>

            <View style={[styles.heroDivider, { backgroundColor: palette.border }]} />

            <View style={styles.heroStat}>
              <View style={styles.heroIcon}>
                <Ionicons name="document-text" size={22} color={Colors.primary} />
              </View>
              <Text style={[styles.heroValue, { color: palette.text }]}>
                {lifetime.totalPagesRead.toLocaleString()}
              </Text>
              <Text style={[styles.heroLabel, { color: palette.muted }]}>
                Total Pages Read
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Books per month
            </Text>
            <Text style={[styles.sectionHint, { color: palette.muted }]}>
              Last 6 months · finished titles
            </Text>
          </View>
          <StatsBarChart data={monthly} isDark={isDark} />
        </View>

        <View
          style={[
            styles.sectionCard,
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}>
          <GenreBreakdown
            title={breakdownUsesGenres ? 'Top genres' : 'Library breakdown'}
            subtitle={
              breakdownUsesGenres
                ? 'Inferred from your saved titles and tags'
                : 'How your shelf is distributed by status'
            }
            data={breakdown}
            isDark={isDark}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: theme.spacing.sm,
  },
  heroCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...theme.shadow.card,
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
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
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
    marginBottom: theme.spacing.sm,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  heroDivider: {
    width: 1,
    marginVertical: theme.spacing.sm,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  sectionHeader: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
});
