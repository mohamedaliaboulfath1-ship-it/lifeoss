import type { Book, BookHighlight } from "@/types/lifeos";

import {
  dbStatusToReadingStatus,
  readingStatusToDb,
  type ReadingStatus,
} from "@/lib/books/book-status";

export type BookMetadata = {
  language?: string;
  description?: string;
  estimatedReadingHours?: number;
  coverUrl?: string;
  publishYear?: number;
  goodreadsRating?: number;
  purchaseUrl?: string;
  readingPhase?: number;
  readingPlanOrder?: number;
  seedTag?: string;
  progressPct?: number;
  readingStatus?: ReadingStatus;
  richNotes?: string;
  archived?: boolean;
  learningPath?: string;
  relatedArea?: string;
};

export type BookRow = Record<string, unknown>;

export function parseBookMetadata(row: BookRow): BookMetadata {
  const meta = (row.metadata as BookMetadata | null) ?? {};
  return meta;
}

export function mapBookRow(row: BookRow, coverUrlFromStorage?: string): Book {
  const meta = parseBookMetadata(row);
  const coverPath = (row.cover_path as string | null) ?? undefined;
  const coverUrl = coverUrlFromStorage ?? meta.coverUrl;
  const rawHighlights = row.highlights;
  const highlights = Array.isArray(rawHighlights)
    ? (rawHighlights as BookHighlight[])
    : [];

  const pages = (row.pages_total as number) ?? undefined;
  const curPage = (row.pages_read as number) ?? 0;
  const progressPct =
    meta.progressPct ??
    (pages ? Math.round((curPage / pages) * 100) : 0);

  const readingStatus = dbStatusToReadingStatus(
    row.status as string | undefined,
    meta.readingStatus
  );

  return {
    id: String(row.id),
    title: String(row.title),
    author: (row.author as string) ?? undefined,
    field: (row.category as string) ?? undefined,
    category: (row.category as string) ?? undefined,
    pages,
    curPage,
    priority: row.priority as Book["priority"],
    status: row.status as Book["status"],
    notes: (row.notes as string) ?? meta.description ?? undefined,
    bookType: (row.book_type as string) ?? "physical",
    coverPath,
    coverUrl,
    highlights,
    rating: (row.rating as number) ?? undefined,
    language: meta.language,
    description: meta.description,
    estimatedReadingHours: meta.estimatedReadingHours,
    publishYear: meta.publishYear,
    goodreadsRating: meta.goodreadsRating,
    purchaseUrl: meta.purchaseUrl,
    readingPhase: meta.readingPhase,
    readingPlanOrder: meta.readingPlanOrder,
    progressPct,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : undefined,
    readingStatus,
    startDate: (row.start_date as string) ?? undefined,
    finishDate: (row.finish_date as string) ?? undefined,
    createdAt: (row.created_at as string) ?? undefined,
    goalId: (row.goal_id as string) ?? undefined,
    richNotes: meta.richNotes,
    archived: meta.archived,
    learningPath: meta.learningPath,
    relatedArea: meta.relatedArea ?? "Learning",
  };
}

export function buildBookMetadata(input: Partial<BookMetadata>): BookMetadata {
  return {
    language: input.language ?? "en",
    description: input.description,
    estimatedReadingHours: input.estimatedReadingHours,
    coverUrl: input.coverUrl,
    publishYear: input.publishYear,
    goodreadsRating: input.goodreadsRating,
    purchaseUrl: input.purchaseUrl,
    readingPhase: input.readingPhase,
    readingPlanOrder: input.readingPlanOrder,
    seedTag: input.seedTag,
    progressPct: input.progressPct ?? 0,
    readingStatus: input.readingStatus,
    richNotes: input.richNotes,
    archived: input.archived,
    learningPath: input.learningPath,
    relatedArea: input.relatedArea,
  };
}

export { readingStatusToDb };
