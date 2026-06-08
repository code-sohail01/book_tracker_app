import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CurrentlyReadingCard from '@/components/CurrentlyReadingCard';
import ContributionHeatmap from '@/components/ContributionHeatmap';
import LogProgressModal from '@/components/LogProgressModal';
import { font } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import {
  computeDashboardStats,
  fetchMyBooks,
  logReadingProgress,
} from '@/services/booksApi';
import type { DashboardStats, ShelfBook } from '@/types/library';
import { aggregateHeatmapData } from '@/utils/heatmapAnalytics';

const CARD_HORIZONTAL_INSET = 24;
const CARD_GAP = 16;

export default function HomeScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { colors, spacing, radius, shadow } = theme;
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressBook, setProgressBook] = useState<ShelfBook | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cardWidth = screenWidth - CARD_HORIZONTAL_INSET * 2;

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const shelf = await fetchMyBooks();
      setBooks(shelf);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not load dashboard',
        'error',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const stats: DashboardStats = useMemo(
    () => computeDashboardStats(books),
    [books],
  );

  const currentlyReading = useMemo(
    () => books.filter((b) => b.status === 'currently_reading'),
    [books],
  );

  const heatmapData = useMemo(() => aggregateHeatmapData(books), [books]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleLogProgress = async (pagesRead: number) => {
    if (!progressBook) return;
    try {
      const result = await logReadingProgress(progressBook.bookId, pagesRead);
      setBooks((prev) =>
        prev.map((b) => (b.bookId === result.book.bookId ? result.book : b)),
      );
      showToast(`Added ${pagesRead} pages to your reading log`, 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not log progress',
        'error',
      );
      throw error;
    }
  };

  const openBook = (book: ShelfBook) => {
    router.push({
      pathname: '/book/[id]',
      params: {
        id: book.bookId,
        title: book.title,
        authors: JSON.stringify(book.authors ?? []),
        coverUrl: book.coverUrl ?? '',
        publisher: book.publisher ?? '',
        pageCount: String(book.totalPages ?? 0),
        status: book.status,
        userRating: String(book.userRating ?? 0),
        fromLibrary: '1',
      },
    });
  };

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
      edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={[styles.greeting, font('semiBold'), { color: colors.textMuted }]}>
              {greeting}
            </Text>
            <Text
              style={[styles.username, font('extraBold'), { color: colors.text }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.85}>
              {user ?? 'Reader'}
            </Text>
            <Text style={[styles.tagline, font('regular'), { color: colors.textMuted }]}>
              Your reading journey at a glance
            </Text>
          </View>
          <Pressable
            onPress={toggleTheme}
            style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons
              name={isDarkMode ? 'sunny' : 'moon'}
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>

        <View
          style={[
            styles.statsCard,
            { backgroundColor: colors.surface, borderColor: colors.border, ...shadow.card },
          ]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, font('extraBold'), { color: colors.text }]}>
              {stats.booksReadThisYear}
            </Text>
            <Text style={[styles.statLabel, font('semiBold'), { color: colors.textMuted }]}>
              Books Read This Year
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, font('extraBold'), { color: colors.text }]}>
              {stats.pagesReadThisYear.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, font('semiBold'), { color: colors.textMuted }]}>
              Pages Read This Year
            </Text>
          </View>
        </View>

        <ContributionHeatmap data={heatmapData} />

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, font('extraBold'), { color: colors.text }]}>
            Currently Reading
          </Text>
          {currentlyReading.length > 0 ? (
            <Text style={[styles.sectionCount, font('semiBold'), { color: colors.textMuted }]}>
              {currentlyReading.length}{' '}
              {currentlyReading.length === 1 ? 'title' : 'titles'}
            </Text>
          ) : null}
        </View>

        {currentlyReading.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border, ...shadow.card },
            ]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, font('extraBold'), { color: colors.text }]}>
              Nothing on your nightstand
            </Text>
            <Text style={[styles.emptyBody, font('regular'), { color: colors.textMuted }]}>
              Head to the Search tab to discover your next read, then mark it as
              Currently Reading.
            </Text>
            <Pressable
              style={[styles.emptyCta, { backgroundColor: colors.primary, borderRadius: radius.md, ...shadow.card }]}
              onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={[styles.emptyCtaText, font('bold')]}>Find a book</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.verticalList}>
            {currentlyReading.map((item) => (
              <View key={item.bookId} style={{ marginBottom: CARD_GAP }}>
                <CurrentlyReadingCard
                  book={item}
                  cardWidth={cardWidth}
                  onPress={() => openBook(item)}
                  onLogProgress={() => {
                    setProgressBook(item);
                    setModalVisible(true);
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <LogProgressModal
        visible={modalVisible}
        book={progressBook}
        onClose={() => {
          setModalVisible(false);
          setProgressBook(null);
        }}
        onSubmit={handleLogProgress}
      />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  header: {
    flex: 1,
  },
  themeToggle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  greeting: {
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    lineHeight: 20,
  },
  username: {
    fontSize: 30,
    letterSpacing: -0.5,
    lineHeight: 38,
    marginTop: 6,
  },
  tagline: {
    fontSize: 16,
    marginTop: 10,
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  statDivider: {
    width: 1,
    marginVertical: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 14,
  },
  verticalList: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  emptyCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    maxWidth: 300,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptyCtaText: {
    color: '#fff',
    fontSize: 16,
  },
});