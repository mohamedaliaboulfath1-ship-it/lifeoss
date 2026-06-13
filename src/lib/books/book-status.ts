export type ReadingStatus =
  | "planned"
  | "reading"
  | "paused"
  | "completed"
  | "dropped";

export const READING_STATUS_CONFIG: Record<
  ReadingStatus,
  { label: string; labelAr: string; color: string; bg: string }
> = {
  planned: {
    label: "Planned",
    labelAr: "مخطط",
    color: "var(--sky)",
    bg: "rgba(80, 170, 255, 0.15)",
  },
  reading: {
    label: "Reading",
    labelAr: "قيد القراءة",
    color: "var(--emerald)",
    bg: "rgba(51, 214, 170, 0.15)",
  },
  paused: {
    label: "Paused",
    labelAr: "متوقف",
    color: "var(--gold)",
    bg: "rgba(255, 208, 94, 0.15)",
  },
  completed: {
    label: "Completed",
    labelAr: "مكتمل",
    color: "var(--emerald2)",
    bg: "rgba(51, 214, 170, 0.22)",
  },
  dropped: {
    label: "Dropped",
    labelAr: "متروك",
    color: "var(--rose)",
    bg: "rgba(255, 100, 120, 0.15)",
  },
};

export function dbStatusToReadingStatus(
  dbStatus?: string,
  metaStatus?: string
): ReadingStatus {
  if (metaStatus && metaStatus in READING_STATUS_CONFIG) {
    return metaStatus as ReadingStatus;
  }
  if (dbStatus === "done") return "completed";
  if (dbStatus === "reading") return "reading";
  return "planned";
}

export function readingStatusToDb(status: ReadingStatus): "planned" | "reading" | "done" {
  if (status === "completed") return "done";
  if (status === "reading" || status === "paused") return "reading";
  return "planned";
}
