import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BookCard from '@/components/BookCard';
import SearchInput from '@/components/SearchInput';
import WhereToModal from '@/components/WhereToModal';
import { API_BASE_URL } from '@/constants/config';
import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';
import { saveBook, volumeToSavePayload } from '@/services/booksApi';
import type { GoogleBookVolume, GoogleBooksSearchResponse } from '@/types/books';
import type { BookStatus } from '@/types/library';
import { navigateToBookDetails } from '@/utils/bookNavigation';

export default function SearchScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<GoogleBookVolume[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [pendingVolume, setPendingVolume] = useState<GoogleBookVolume | null>(null);
  const [whereToVisible, setWhereToVisible] = useState(false);

  const fetchResults = useCallback(
    async (searchTerm: string) => {
      const trimmed = searchTerm.trim();
      if (!trimmed) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/books/search?q=${encodeURIComponent(trimmed)}`,
        );
        const raw = await response.text();
        const data: GoogleBooksSearchResponse = raw ? JSON.parse(raw) : { totalItems: 0 };

        if (!response.ok) {
          throw new Error(
            (data as { message?: string }).message || 'Search failed.',
          );
        }

        setResults(data.items ?? []);
      } catch (error) {
        setResults([]);
        showToast(
          error instanceof Error ? error.message : 'Could not search books.',
          'error',
        );
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  const openWhereTo = (volume: GoogleBookVolume) => {
    setPendingVolume(volume);
    setWhereToVisible(true);
  };

  const saveWithStatus = async (status: BookStatus) => {
    if (!pendingVolume) return;
    const volume = pendingVolume;
    setWhereToVisible(false);
    setSavingId(volume.id);

    try {
      const payload = volumeToSavePayload(volume, status, 0);
      if (status === 'finished') {
        payload.dateFinished = new Date().toISOString();
      }
      await saveBook(payload);
      showToast('Book added to your library', 'success');
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Could not save book.',
        'error',
      );
    } finally {
      setSavingId(null);
      setPendingVolume(null);
    }
  };

  const showEmpty =
    !loading && hasSearched && debouncedQuery.trim().length > 0 && results.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Discover books</Text>
        <Text style={styles.subheading}>Live search powered by Google Books</Text>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          loading={loading && debouncedQuery.trim().length > 0}
          onClear={() => setQuery('')}
        />
      </View>

      {loading && results.length === 0 && debouncedQuery.trim().length > 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : (
        <FlatList
          data={results || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            results.length === 0 && styles.listEmpty,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>
                {showEmpty ? 'No results' : 'Start typing to search'}
              </Text>
              <Text style={styles.emptyBody}>
                {showEmpty
                  ? `Nothing matched "${debouncedQuery.trim()}". Try another title or author.`
                  : 'Find titles, authors, or ISBNs to add to your library.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <BookCard
              book={item}
              onPress={() => navigateToBookDetails(router, item)}
              onAdd={() => openWhereTo(item)}
              isAdding={savingId === item.id}
            />
          )}
        />
      )}

      <WhereToModal
        visible={whereToVisible}
        bookTitle={pendingVolume?.volumeInfo.title}
        onClose={() => {
          setWhereToVisible(false);
          setPendingVolume(null);
        }}
        onSelect={saveWithStatus}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBlock: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: theme.spacing.md,
  },
  list: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  emptyWrap: {
    paddingTop: 48,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyBody: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
});
