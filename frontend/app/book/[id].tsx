import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StarRating from '@/components/StarRating';
import StatusPicker from '@/components/StatusPicker';
import { Colors } from '@/constants/Colors';
import { theme } from '@/constants/theme';
import {
  fetchGoogleVolume,
  fetchMyBooks,
  saveBook,
  updateBook,
  volumeToSavePayload,
} from '@/services/booksApi';
import type { GoogleBookVolume } from '@/types/books';
import type { BookSavePayload, BookStatus, ShelfBook } from '@/types/library';

function parseAuthors(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const value = Array.isArray(raw) ? raw[0] : raw;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value ? [value] : [];
  }
}

function secureCover(url: string) {
  return url ? url.replace('http://', 'https://') : '';
}

export default function BookDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const params = useLocalSearchParams<{
    id: string;
    title?: string;
    authors?: string;
    coverUrl?: string;
    publisher?: string;
    pageCount?: string;
    publishedDate?: string;
    status?: BookStatus;
    userRating?: string;
    fromLibrary?: string;
  }>();

  const bookId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [volume, setVolume] = useState<GoogleBookVolume | null>(null);
  const [savedCopy, setSavedCopy] = useState<ShelfBook | null>(null);
  const [status, setStatus] = useState<BookStatus>('read_later');
  const [rating, setRating] = useState(0);

  const isInLibrary = Boolean(savedCopy);

  const palette = useMemo(
    () =>
      isDark
        ? {
            bg: '#0B1220',
            card: '#151D2E',
            text: '#F8FAFC',
            muted: '#94A3B8',
            fade: ['transparent', '#0B1220'] as const,
          }
        : {
            bg: Colors.background,
            card: Colors.surface,
            text: Colors.text,
            muted: Colors.textMuted,
            fade: ['transparent', Colors.background] as const,
          },
    [isDark],
  );

  const loadBook = useCallback(async () => {
    if (!bookId) return;
    setLoading(true);
    try {
      const [googleVolume, library] = await Promise.all([
        fetchGoogleVolume(bookId).catch(() => null),
        fetchMyBooks().catch(() => [] as ShelfBook[]),
      ]);

      const existing = library.find((b) => b.bookId === bookId) ?? null;
      setSavedCopy(existing);

      const paramTitle = Array.isArray(params.title) ? params.title[0] : params.title;
      const merged: GoogleBookVolume =
        googleVolume ??
        ({
          id: bookId,
          volumeInfo: {
            title: paramTitle ?? 'Untitled',
            authors: parseAuthors(params.authors),
            publisher: Array.isArray(params.publisher)
              ? params.publisher[0]
              : params.publisher,
            pageCount: Number(
              Array.isArray(params.pageCount) ? params.pageCount[0] : params.pageCount,
            ) || undefined,
            publishedDate: Array.isArray(params.publishedDate)
              ? params.publishedDate[0]
              : params.publishedDate,
            imageLinks: {
              thumbnail: Array.isArray(params.coverUrl)
                ? params.coverUrl[0]
                : params.coverUrl,
            },
          },
        } as GoogleBookVolume);

      setVolume(merged);

      const paramStatus = Array.isArray(params.status) ? params.status[0] : params.status;
      const paramRating = Array.isArray(params.userRating)
        ? params.userRating[0]
        : params.userRating;

      setStatus(
        (existing?.status as BookStatus) ||
          (paramStatus as BookStatus) ||
          'read_later',
      );
      setRating(existing?.userRating ?? (Number(paramRating) || 0));
    } catch (error) {
      Alert.alert(
        'Could not load book',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]); // ✅ FIXED: Removed 'params' to permanently kill the infinite loop

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  const info = volume?.volumeInfo;
  const cover =
    secureCover(
      info?.imageLinks?.thumbnail ??
        info?.imageLinks?.smallThumbnail ??
        (Array.isArray(params.coverUrl) ? params.coverUrl[0] : params.coverUrl) ??
        '',
    ) || 'https://via.placeholder.com/400x600?text=No+Cover';

  const handleSave = async () => {
    if (!volume) return;
    setSaving(true);
    try {
      const payload: BookSavePayload = {
        ...volumeToSavePayload(volume, status, rating),
        status,
        userRating: rating,
      };

      if (isInLibrary) {
        await updateBook(bookId, payload);
        Alert.alert('Updated', 'Your library entry has been updated.');
      } else {
        await saveBook(payload);
        Alert.alert('Saved', 'Book added to your library.');
      }
      router.back();
    } catch (error) {
      Alert.alert(
        'Save failed',
        error instanceof Error ? error.message : 'Could not save book.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !volume) {
    return (
      <View style={[styles.centered, { backgroundColor: palette.bg }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const authors = (info?.authors ?? []).join(', ') || 'Unknown author';
  const pageCount = info?.pageCount;
  const publisher = info?.publisher;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.heroWrap}>
          <ImageBackground source={{ uri: cover }} style={styles.hero} resizeMode="cover">
            <View style={[styles.heroFade, { backgroundColor: palette.fade[0] }]} />
            <View
              style={[
                styles.heroFadeBottom,
                { backgroundColor: isDark ? '#0B1220' : Colors.background },
              ]}
            />
          </ImageBackground>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + 8 }]}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>

        <View style={[styles.sheet, { backgroundColor: palette.bg }]}>
          <View style={[styles.coverFloat]}>
            <Image source={{ uri: cover }} style={styles.coverThumb} />
          </View>

          <View style={styles.metaBlock}>
            <Text style={[styles.bookTitle, { color: palette.text }]}>
              {info?.title ?? 'Untitled'}
            </Text>
            <Text style={[styles.bookAuthor, { color: palette.muted }]}>{authors}</Text>

            <View style={styles.metaGrid}>
              {publisher ? (
                <View style={[styles.metaItem, { backgroundColor: palette.card }]}>
                  <Text style={styles.metaLabel}>Publisher</Text>
                  <Text style={[styles.metaValue, { color: palette.text }]} numberOfLines={2}>
                    {publisher}
                  </Text>
                </View>
              ) : null}
              {pageCount ? (
                <View style={[styles.metaItem, { backgroundColor: palette.card }]}>
                  <Text style={styles.metaLabel}>Pages</Text>
                  <Text style={[styles.metaValue, { color: palette.text }]}>
                    {pageCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: palette.card }]}>
            <StatusPicker value={status} onChange={setStatus} />
            <Text style={styles.sectionTitle}>Your rating</Text>
            <StarRating value={rating} onChange={setRating} />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + theme.spacing.md,
            backgroundColor: palette.card,
            borderTopColor: isDark ? '#334155' : Colors.border,
          },
        ]}>
        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isInLibrary ? 'Update Book' : 'Save to Library'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroWrap: { height: 300, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  heroFade: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
  },
  heroFadeBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 140,
    opacity: 0.95,
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  backText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sheet: {
    marginTop: -48,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  coverFloat: {
    alignSelf: 'center',
    marginTop: -100,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  coverThumb: {
    width: 120,
    height: 180,
    borderRadius: theme.radius.md,
    borderWidth: 3,
    borderColor: Colors.surface,
  },
  metaBlock: { marginTop: theme.spacing.sm },
  bookTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  bookAuthor: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 22,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  metaItem: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: { fontSize: 15, fontWeight: '600' },
  section: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...theme.shadow.card,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 18,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});