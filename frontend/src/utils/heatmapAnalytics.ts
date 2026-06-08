import type { ShelfBook } from '@/types/library';

export type HeatmapData = Record<string, number>;

/** Local calendar day as YYYY-MM-DD. */
export function toDateKey(value: string | Date): string {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Sum pages read per day across every book on the shelf. */
export function aggregateHeatmapData(books: ShelfBook[]): HeatmapData {
  const data: HeatmapData = {};

  for (const book of books) {
    for (const session of book.readingLog ?? []) {
      const key = toDateKey(session.date);
      if (!key) continue;
      data[key] = (data[key] ?? 0) + (session.pagesRead ?? 0);
    }
  }

  return data;
}

/** Last N calendar days ending today (inclusive), oldest first. */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const today = new Date();

  for (let offset = n - 1; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    days.push(toDateKey(d));
  }

  return days;
}

export function getHeatmapMaxPages(data: HeatmapData, days: string[]): number {
  let max = 0;
  for (const day of days) {
    const pages = data[day] ?? 0;
    if (pages > max) max = pages;
  }
  return max;
}

/** 0 = none, 1–4 = increasing intensity quartiles. */
export function getHeatmapLevel(pages: number, maxPages: number): 0 | 1 | 2 | 3 | 4 {
  if (pages <= 0) return 0;
  if (maxPages <= 0) return 1;
  const ratio = pages / maxPages;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}
