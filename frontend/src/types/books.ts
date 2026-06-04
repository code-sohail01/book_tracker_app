export interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
  };
}

export function getPublishedYear(volume: GoogleBookVolume): string | null {
  const raw = volume.volumeInfo.publishedDate;
  if (!raw) return null;
  const year = raw.match(/\d{4}/)?.[0];
  return year ?? null;
}

export interface GoogleBooksSearchResponse {
  items?: GoogleBookVolume[];
  totalItems: number;
}
