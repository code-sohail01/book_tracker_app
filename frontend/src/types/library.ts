export type BookStatus =
  | 'read_later'
  | 'currently_reading'
  | 'finished'
  | 'dnf';

export const BOOK_STATUS_OPTIONS: {
  value: BookStatus;
  label: string;
}[] = [
  { value: 'currently_reading', label: 'Currently Reading' },
  { value: 'read_later', label: 'Read Later' },
  { value: 'finished', label: 'Finished' },
  { value: 'dnf', label: 'Did Not Finish' },
];

export type ReadingSession = {
  date: string;
  pagesRead: number;
  note?: string;
};

export type ShelfBook = {
  _id?: string;
  bookId: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  publisher?: string;
  publishedDate?: string;
  totalPages?: number;
  currentPage?: number;
  status: BookStatus;
  userRating?: number;
  readingLog?: ReadingSession[];
  tags?: string[];
  dateStarted?: string;
  dateFinished?: string;
  dateAdded?: string;
};

export type DashboardStats = {
  booksReadThisYear: number;
  pagesReadThisYear: number;
};

export type BookSavePayload = {
  bookId: string;
  title: string;
  authors: string[];
  coverUrl?: string;
  publisher?: string;
  publishedDate?: string;
  totalPages?: number;
  status: BookStatus;
  userRating: number;
  tags?: string[];
  dateStarted?: string;
  dateFinished?: string;
};
