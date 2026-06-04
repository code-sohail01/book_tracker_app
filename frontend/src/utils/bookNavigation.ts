import type { GoogleBookVolume } from '@/types/books';
import type { BookStatus } from '@/types/library';

export function navigateToBookDetails(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: { push: (href: any) => void },
  volume: GoogleBookVolume,
  extras?: { status?: BookStatus; userRating?: number; fromLibrary?: boolean },
) {
  const info = volume.volumeInfo;
  router.push({
    pathname: '/book/[id]',
    params: {
      id: volume.id,
      title: info.title ?? 'Untitled',
      authors: JSON.stringify(info.authors ?? []),
      coverUrl:
        info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? '',
      publisher: info.publisher ?? '',
      pageCount: String(info.pageCount ?? 0),
      publishedDate: info.publishedDate ?? '',
      ...(extras?.status ? { status: extras.status } : {}),
      ...(extras?.userRating != null
        ? { userRating: String(extras.userRating) }
        : {}),
      ...(extras?.fromLibrary ? { fromLibrary: '1' } : {}),
    },
  });
}
