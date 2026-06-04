import type { BookStatus, ShelfBook } from '@/types/library';

export type LifetimeStats = {
  totalBooksRead: number;
  totalPagesRead: number;
};

export type MonthBucket = {
  key: string;
  label: string;
  count: number;
};

export type GenreSlice = {
  label: string;
  count: number;
  percent: number;
};

const GENRE_RULES: { label: string; patterns: RegExp[] }[] = [
  { label: 'Sci-Fi', patterns: [/sci[- ]?fi/i, /space/i, /galaxy/i, /dystopi/i] },
  { label: 'Fantasy', patterns: [/fantasy/i, /dragon/i, /magic/i, /wizard/i, /kingdom/i] },
  { label: 'Mystery', patterns: [/mystery/i, /thriller/i, /detective/i, /murder/i] },
  { label: 'Romance', patterns: [/romance/i, /love story/i] },
  { label: 'History', patterns: [/history/i, /war/i, /world war/i, /biograph/i] },
  { label: 'Non-Fiction', patterns: [/self[- ]?help/i, /business/i, /economics/i, /science/i] },
  { label: 'Classics', patterns: [/classic/i, /penguin classics/i] },
];

const STATUS_LABELS: Record<BookStatus, string> = {
  finished: 'Finished',
  currently_reading: 'Currently Reading',
  read_later: 'Read Later',
  dnf: 'Did Not Finish',
};

function getFinishedDate(book: ShelfBook): Date | null {
  if (book.dateFinished) {
    const d = new Date(book.dateFinished);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (book.status === 'finished' && book.dateAdded) {
    const d = new Date(book.dateAdded);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function computeLifetimeStats(books: ShelfBook[]): LifetimeStats {
  const finished = books.filter((b) => b.status === 'finished');
  let totalPagesRead = 0;

  for (const book of books) {
    const logged = (book.readingLog ?? []).reduce(
      (sum, session) => sum + (session.pagesRead ?? 0),
      0,
    );
    if (logged > 0) {
      totalPagesRead += logged;
      continue;
    }
    if (book.status === 'finished' && (book.totalPages ?? 0) > 0) {
      totalPagesRead += book.totalPages ?? 0;
      continue;
    }
    totalPagesRead += book.currentPage ?? 0;
  }

  return {
    totalBooksRead: finished.length,
    totalPagesRead,
  };
}

export function computeBooksPerMonth(books: ShelfBook[], monthsBack = 6): MonthBucket[] {
  const now = new Date();
  const buckets: MonthBucket[] = [];

  for (let offset = monthsBack - 1; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleString(undefined, { month: 'short' }),
      count: 0,
    });
  }

  for (const book of books) {
    if (book.status !== 'finished') continue;
    const finishedAt = getFinishedDate(book);
    if (!finishedAt) continue;

    const key = `${finishedAt.getFullYear()}-${finishedAt.getMonth()}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

function inferGenreFromBook(book: ShelfBook): string | null {
  if (book.tags?.length) {
    return book.tags[0];
  }

  const haystack = `${book.title} ${(book.authors ?? []).join(' ')}`.toLowerCase();
  for (const rule of GENRE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.label;
    }
  }
  return null;
}

export function computeGenreBreakdown(books: ShelfBook[]): GenreSlice[] {
  const counts = new Map<string, number>();

  for (const book of books) {
    const genre = inferGenreFromBook(book) ?? 'General Fiction';
    counts.set(genre, (counts.get(genre) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return [];
  }

  const total = books.length;
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, count]) => ({
      label,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

  const percentSum = sorted.reduce((s, item) => s + item.percent, 0);
  if (percentSum > 0 && percentSum !== 100 && sorted.length > 0) {
    sorted[0].percent += 100 - percentSum;
  }

  return sorted;
}

export function computeStatusBreakdown(books: ShelfBook[]): GenreSlice[] {
  const counts = new Map<BookStatus, number>();
  for (const book of books) {
    const status = book.status ?? 'read_later';
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }

  const total = books.length;
  if (total === 0) return [];

  return (Object.keys(STATUS_LABELS) as BookStatus[])
    .map((status) => ({
      label: STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
      percent: Math.round(((counts.get(status) ?? 0) / total) * 100),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function computeLibraryBreakdown(books: ShelfBook[]): GenreSlice[] {
  const genreSlices = computeGenreBreakdown(books);
  if (genreSlices.length > 0 && books.length >= 2) {
    return genreSlices;
  }
  return computeStatusBreakdown(books);
}
