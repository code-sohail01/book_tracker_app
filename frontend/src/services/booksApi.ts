import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '@/constants/config';
import type { BookSavePayload, DashboardStats, ShelfBook } from '@/types/library';
import type { GoogleBookVolume } from '@/types/books';

const TOKEN_KEY = 'userToken';

export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : {};
  if (!response.ok) {
    throw new Error((data as { message?: string }).message || 'Request failed.');
  }
  return data as T;
}

export async function fetchMyBooks(): Promise<ShelfBook[]> {
  const response = await fetch(`${API_BASE_URL}/api/books`, {
    headers: await getAuthHeaders(),
  });
  const data = await parseJson<ShelfBook[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function saveBook(payload: BookSavePayload): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/books`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ book: payload }),
  });
  return parseJson(response);
}

export async function updateBook(
  bookId: string,
  payload: Partial<BookSavePayload>,
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}`,
    {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ book: payload }),
    },
  );
  return parseJson(response);
}

export async function fetchGoogleVolume(volumeId: string): Promise<GoogleBookVolume> {
  const response = await fetch(
    `${API_BASE_URL}/api/books/volume/${encodeURIComponent(volumeId)}`,
  );
  return parseJson(response);
}

function isInCurrentYear(dateValue?: string): boolean {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  return !Number.isNaN(d.getTime()) && d.getFullYear() === new Date().getFullYear();
}

export function computeDashboardStats(books: ShelfBook[]): DashboardStats {
  const year = new Date().getFullYear();
  let booksReadThisYear = 0;
  let pagesReadThisYear = 0;

  for (const book of books) {
    if (book.status === 'finished') {
      if (book.dateFinished) {
        if (isInCurrentYear(book.dateFinished)) booksReadThisYear += 1;
      } else if (isInCurrentYear(book.dateAdded)) {
        booksReadThisYear += 1;
      } else if (!book.dateAdded) {
        booksReadThisYear += 1;
      }
    }

    for (const session of book.readingLog ?? []) {
      const sessionYear = new Date(session.date).getFullYear();
      if (sessionYear === year) {
        pagesReadThisYear += session.pagesRead ?? 0;
      }
    }

    if (book.status === 'finished' && (book.totalPages ?? 0) > 0 && isInCurrentYear(book.dateFinished)) {
      const logged = (book.readingLog ?? []).reduce((s, r) => s + (r.pagesRead ?? 0), 0);
      if (logged === 0) {
        pagesReadThisYear += book.totalPages ?? 0;
      }
    }
  }

  return { booksReadThisYear, pagesReadThisYear };
}

export async function deleteBooksBatch(bookIds: string[]): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/books/batch`, {
    method: 'DELETE',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ bookIds }),
  });
  return parseJson(response);
}

export async function batchUpdateBooks(
  bookIds: string[],
  updates: Partial<BookSavePayload>,
): Promise<{ message: string; shelf: ShelfBook[] }> {
  const response = await fetch(`${API_BASE_URL}/api/books/batch`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ bookIds, updates }),
  });
  return parseJson(response);
}

export function getReadingProgressPercent(book: ShelfBook): number {
  const total = book.totalPages ?? 0;
  const current = book.currentPage ?? 0;
  if (total > 0) {
    return Math.min(100, Math.round((current / total) * 100));
  }
  const logged = (book.readingLog ?? []).reduce(
    (sum, s) => sum + (s.pagesRead ?? 0),
    0,
  );
  if (logged > 0) {
    return Math.min(100, Math.max(8, Math.round(Math.log10(logged + 1) * 25)));
  }
  return 5;
}

export async function logReadingProgress(
  bookId: string,
  pagesRead: number,
): Promise<{ message: string; book: ShelfBook }> {
  const response = await fetch(
    `${API_BASE_URL}/api/books/${encodeURIComponent(bookId)}/progress`,
    {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ pagesRead }),
    },
  );
  return parseJson(response);
}

export function volumeToSavePayload(
  volume: GoogleBookVolume,
  status: BookSavePayload['status'],
  userRating: number,
): BookSavePayload {
  const info = volume.volumeInfo;
  return {
    bookId: volume.id,
    title: info.title ?? 'Untitled',
    authors: info.authors ?? [],
    coverUrl:
      info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? '',
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    totalPages: info.pageCount ?? 0,
    status,
    userRating,
  };
}
