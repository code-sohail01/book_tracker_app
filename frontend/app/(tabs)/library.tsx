import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import LibraryBookCard from '@/components/LibraryBookCard';
import LibrarySegmentedTabs, { type LibraryTab } from '@/components/LibrarySegmentedTabs';
import WhereToModal from '@/components/WhereToModal';
import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import {
  batchUpdateBooks,
  deleteBooksBatch,
  fetchMyBooks,
  updateBook,         // <--- ADD THIS
  fetchGoogleVolume,  // <--- ADD THIS
} from '@/services/booksApi';
import type { BookStatus, ShelfBook } from '@/types/library';

const GRID_GAP = 16;
const NUM_COLUMNS = 3;

const LIBRARY_TABS: LibraryTab[] = [
  { key: 'finished', label: 'Finished', short: 'Finished' },
  { key: 'currently_reading', label: 'Currently Reading', short: 'Reading' },
  { key: 'read_later', label: 'Read Later', short: 'Read Later' },
  { key: 'dnf', label: 'Did Not Finish', short: 'DNF' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { showToast } = useToast();
  const isDark = useColorScheme() === 'dark';

  const [activeTab, setActiveTab] = useState<BookStatus>('currently_reading');
  const [books, setBooks] = useState<ShelfBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [acting, setActing] = useState(false);

  const horizontalPadding = theme.spacing.lg * 2;
  const itemWidth =
    (screenWidth - horizontalPadding - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const palette = useMemo(
    () =>
      isDark
        ? { bg: '#0B1220', card: '#151D2E', text: '#F8FAFC', muted: '#94A3B8' }
        : {
            bg: Colors.background,
            card: Colors.surface,
            text: Colors.text,
            muted: Colors.textMuted,
          },
    [isDark],
  );

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const shelf = await fetchMyBooks();
      setBooks(shelf);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load library.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary]),
  );

  const filtered = useMemo(
    () => books.filter((b) => (b.status ?? 'read_later') === activeTab),
    [books, activeTab],
  );

  const toggleSelect = (bookId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleCardPress = (book: ShelfBook) => {
    if (selectionMode) {
      toggleSelect(book.bookId);
      return;
    }
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

  const handleDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setActing(true);
    try {
      await deleteBooksBatch(ids);
      setBooks((prev) => prev.filter((b) => !selectedIds.has(b.bookId)));
      showToast(`${ids.length} book(s) removed`, 'success');
      exitSelection();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not delete books',
        'error',
      );
    } finally {
      setActing(false);
    }
  };

const handleMove = async (status: BookStatus) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setActing(true);
    setMoveModalVisible(false);

    try {
      // Loop through each selected book to fetch its fresh Google data
      // This makes the "Move" button act exactly like the "Update Book" button!
      for (const bookId of ids) {
        // 1. Fetch fresh data directly from Google
        const volume = await fetchGoogleVolume(bookId).catch(() => null);

        // 2. Build the update payload with the new status
        const payload: any = {
          status,
          ...(status === 'finished' ? { dateFinished: new Date().toISOString() } : {}),
        };

        // 3. If Google has the real page count, inject it to fix the progress bar
        if (volume?.volumeInfo?.pageCount) {
          payload.totalPages = volume.volumeInfo.pageCount;
        }

        // 4. Send the powerful update to the backend
        await updateBook(bookId, payload);
      }

      // 5. Reload the library to instantly show the new page numbers
      await loadLibrary();

      showToast(`${ids.length} book(s) moved`, 'success');
      exitSelection();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Could not move books',
        'error',
      );
    } finally {
      setActing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: palette.bg }]}
      edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={[styles.heading, { color: palette.text }]}>My Library</Text>
            <Text style={[styles.subheading, { color: palette.muted }]}>
              {books.length} {books.length === 1 ? 'book' : 'books'} saved
            </Text>
          </View>
          <Pressable
            style={[styles.selectBtn, selectionMode && styles.selectBtnActive]}
            onPress={() => {
              if (selectionMode) exitSelection();
              else setSelectionMode(true);
            }}>
            <Text
              style={[
                styles.selectBtnText,
                selectionMode && styles.selectBtnTextActive,
              ]}>
              {selectionMode ? 'Done' : 'Select'}
            </Text>
          </Pressable>
        </View>
      </View>

      <LibrarySegmentedTabs
        tabs={LIBRARY_TABS}
        active={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          exitSelection();
        }}
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: palette.text }]}>{error}</Text>
          <Pressable style={styles.retry} onPress={loadLibrary}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.bookId}
          numColumns={NUM_COLUMNS}
          columnWrapperStyle={[styles.gridRow, { gap: GRID_GAP }]}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>
                No books here yet
              </Text>
              <Text style={[styles.emptyBody, { color: palette.muted }]}>
                Save titles from Search or mark books with this status.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <LibraryBookCard
              book={item}
              width={itemWidth}
              selectionMode={selectionMode}
              selected={selectedIds.has(item.bookId)}
              onPress={() => handleCardPress(item)}
              onLongPress={() => {
                if (!selectionMode) {
                  setSelectionMode(true);
                  setSelectedIds(new Set([item.bookId]));
                }
              }}
            />
          )}
        />
      )}

      {selectionMode && selectedIds.size > 0 ? (
        <View
          style={[
            styles.fabBar,
            {
              paddingBottom: insets.bottom + theme.spacing.md,
              backgroundColor: palette.card,
              borderTopColor: isDark ? '#334155' : Colors.border,
            },
          ]}>
          <Text style={[styles.fabLabel, { color: palette.muted }]}>
            {selectedIds.size} selected
          </Text>
          <View style={styles.fabActions}>
            <Pressable
              style={styles.fabSecondary}
              onPress={() => setMoveModalVisible(true)}
              disabled={acting}>
              <Ionicons name="folder-open-outline" size={18} color={Colors.primary} />
              <Text style={styles.fabSecondaryText}>Move to…</Text>
            </Pressable>
            <Pressable
              style={styles.fabDanger}
              onPress={handleDelete}
              disabled={acting}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.fabDangerText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <WhereToModal
        visible={moveModalVisible}
        title="Move to…"
        subtitle={`Move ${selectedIds.size} selected book(s) to`}
        onClose={() => setMoveModalVisible(false)}
        onSelect={handleMove}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerText: { flex: 1 },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  selectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  selectBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  selectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  selectBtnTextActive: {
    color: Colors.primary,
  },
  grid: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 120,
  },
  gridRow: {
    marginBottom: GRID_GAP,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    paddingHorizontal: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
  retry: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: theme.radius.md,
  },
  retryText: { color: '#fff', fontWeight: '700' },
  fabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    ...theme.shadow.tabBar,
  },
  fabLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  fabActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  fabSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  fabSecondaryText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  fabDanger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    backgroundColor: Colors.error,
  },
  fabDangerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});