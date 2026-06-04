import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CurrentlyReadingCard from '@/components/CurrentlyReadingCard';
import LogProgressModal from '@/components/LogProgressModal';
import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  computeDashboardStats,
  fetchMyBooks,
  logReadingProgress,
} from '@/services/booksApi';
import type { DashboardStats, ShelfBook } from '@/types/library';

const CARD_HORIZONTAL_INSET = theme.spacing.lg;
const CARD_GAP = theme.spacing.md;

export default function HomeScreen() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isDark = useColorScheme() === 'dark';

  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressBook, setProgressBook] = useState<ShelfBook | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const cardWidth = screenWidth - CARD_HORIZONTAL_INSET * 2;

  const palette = useMemo(
    () =>
      isDark
        ? {
            bg: '#0B1220',
            card: '#151D2E',
            text: '#F8FAFC',
            muted: '#94A3B8',
            statDivider: '#334155',
          }
        : {
            bg: Colors.background,
            card: Colors.surface,
            text: Colors.text,
            muted: Colors.textMuted,
            statDivider: Colors.border,
          },
    [isDark],
  );

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
      <View style={[styles.centered, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: palette.bg }]}
      edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboard(true)}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: palette.muted }]}>{greeting}</Text>
          <Text
            style={[styles.username, { color: palette.text }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
            {user ?? 'Reader'}
          </Text>
          <Text style={[styles.tagline, { color: palette.muted }]}>
            Your reading journey at a glance
          </Text>
        </View>

        <View
          style={[
            styles.statsCard,
            { backgroundColor: palette.card, borderColor: palette.statDivider },
          ]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {stats.booksReadThisYear}
            </Text>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Books Read This Year
            </Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: palette.statDivider }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: palette.text }]}>
              {stats.pagesReadThisYear.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: palette.muted }]}>
              Pages Read This Year
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Currently Reading
          </Text>
          {currentlyReading.length > 0 ? (
            <Text style={[styles.sectionCount, { color: palette.muted }]}>
              {currentlyReading.length}{' '}
              {currentlyReading.length === 1 ? 'title' : 'titles'}
            </Text>
          ) : null}
        </View>

        {currentlyReading.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: palette.card, borderColor: palette.statDivider },
            ]}>
            <View style={styles.emptyIcon}>
              <Ionicons name="book-outline" size={32} color={Colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: palette.text }]}>
              Nothing on your nightstand
            </Text>
            <Text style={[styles.emptyBody, { color: palette.muted }]}>
              Head to the Search tab to discover your next read, then mark it as
              Currently Reading.
            </Text>
            <Pressable
              style={styles.emptyCta}
              onPress={() => router.push('/(tabs)/search')}>
              <Ionicons name="search" size={18} color="#fff" />
              <Text style={styles.emptyCtaText}>Find a book</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={currentlyReading}
            keyExtractor={(item) => item.bookId}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + CARD_GAP}
            decelerationRate="fast"
            snapToAlignment="start"
            contentContainerStyle={styles.carousel}
            renderItem={({ item }) => (
              <CurrentlyReadingCard
                book={item}
                cardWidth={cardWidth}
                onPress={() => openBook(item)}
                onLogProgress={() => {
                  setProgressBook(item);
                  setModalVisible(true);
                }}
              />
            )}
          />
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
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    lineHeight: 20,
  },
  username: {
    fontSize: 30,
    fontWeight: '800',
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
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    ...theme.shadow.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
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
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  carousel: {
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.lg - CARD_GAP,
    paddingBottom: theme.spacing.sm,
  },
  emptyCard: {
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    ...theme.shadow.card,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: theme.spacing.sm,
    maxWidth: 300,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.lg,
    backgroundColor: Colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    ...theme.shadow.card,
  },
  emptyCtaText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});