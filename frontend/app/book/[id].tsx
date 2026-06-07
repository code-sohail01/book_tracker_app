import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StarRating from '@/components/StarRating';
import StatusPicker from '@/components/StatusPicker';
import { font } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
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

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function BookDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius, shadow } = theme;

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
  }, [bookId]);

  useEffect(() => {
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const info = volume?.volumeInfo;
  const cover =
    secureCover(
      info?.imageLinks?.thumbnail ??
        info?.imageLinks?.smallThumbnail ??
        (Array.isArray(params.coverUrl) ? params.coverUrl[0] : params.coverUrl) ??
        '',
    ) || 'https://via.placeholder.com/400x600?text=No+Cover';

  const description = info?.description
    ? stripHtml(info.description)
    : 'No description available for this title.';

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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const authors = (info?.authors ?? []).join(', ') || 'Unknown author';
  const pageCount = info?.pageCount;
  const publisher = info?.publisher;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <View style={styles.heroWrap}>
          <ImageBackground source={{ uri: cover }} style={styles.hero} resizeMode="cover">
            <View style={[styles.heroFade, { backgroundColor: 'transparent' }]} />
            <View
              style={[
                styles.heroFadeBottom,
                { backgroundColor: colors.background },
              ]}
            />
          </ImageBackground>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { top: insets.top + 8 }]}>
            <Text style={[styles.backText, font('semiBold')]}>← Back</Text>
          </Pressable>
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.coverFloat}>
            <Image
              source={{ uri: cover }}
              style={[styles.coverThumb, { borderColor: colors.surface }]}
            />
          </View>

          <View style={styles.metaBlock}>
            <Text style={[styles.bookTitle, font('extraBold'), { color: colors.text }]}>
              {info?.title ?? 'Untitled'}
            </Text>
            <Text style={[styles.bookAuthor, font('medium'), { color: colors.textMuted }]}>
              {authors}
            </Text>

            <View style={[styles.metaGrid, { gap: spacing.md }]}>
              {publisher ? (
                <View
                  style={[
                    styles.metaItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}>
                  <Text style={[styles.metaLabel, font('bold'), { color: colors.textMuted }]}>
                    Publisher
                  </Text>
                  <Text
                    style={[styles.metaValue, font('semiBold'), { color: colors.text }]}
                    numberOfLines={2}>
                    {publisher}
                  </Text>
                </View>
              ) : null}
              {pageCount ? (
                <View
                  style={[
                    styles.metaItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                    },
                  ]}>
                  <Text style={[styles.metaLabel, font('bold'), { color: colors.textMuted }]}>
                    Pages
                  </Text>
                  <Text style={[styles.metaValue, font('semiBold'), { color: colors.text }]}>
                    {pageCount}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                ...shadow.card,
              },
            ]}>
            <StatusPicker value={status} onChange={setStatus} />
            <Text style={[styles.sectionTitle, font('bold'), { color: colors.textMuted }]}>
              Your rating
            </Text>
            <StarRating value={rating} onChange={setRating} />
          </View>

          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.lg,
                marginTop: spacing.lg,
                ...shadow.card,
              },
            ]}>
            <Text style={[styles.sectionTitle, font('bold'), { color: colors.textMuted }]}>
              Description
            </Text>
            <Text
              style={[
                styles.description,
                font('regular'),
                { color: isDarkMode ? colors.text : colors.text },
              ]}>
              {description}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        ]}>
        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: colors.primary, borderRadius: radius.md, ...shadow.card },
            saving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.saveButtonText, font('extraBold')]}>
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
    left: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  backText: { color: '#fff', fontSize: 15 },
  sheet: {
    marginTop: -48,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  coverFloat: {
    alignSelf: 'center',
    marginTop: -100,
    marginBottom: 16,
  },
  coverThumb: {
    width: 120,
    height: 180,
    borderRadius: 12,
    borderWidth: 3,
  },
  metaBlock: { marginTop: 8 },
  bookTitle: {
    fontSize: 26,
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  bookAuthor: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  metaGrid: {
    flexDirection: 'row',
    marginTop: 24,
  },
  metaItem: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
  },
  metaLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: { fontSize: 15 },
  section: {
    marginTop: 24,
    padding: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    letterSpacing: 0.3,
  },
});
