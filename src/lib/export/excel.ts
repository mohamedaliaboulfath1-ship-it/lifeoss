import * as XLSX from "xlsx";
import type { YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";

export function buildDashboardExcel(
  yearData: YearPayload,
  dashboard?: DashboardSnapshot | null
): Uint8Array {
  const wb = XLSX.utils.book_new();

  const scoreRows = [
    { metric: "Life Score", value: dashboard?.scores.lifeScore ?? 0 },
    { metric: "Discipline", value: dashboard?.scores.disciplineScore ?? 0 },
    { metric: "Health", value: dashboard?.scores.healthScore ?? 0 },
    { metric: "Finance", value: dashboard?.scores.financeScore ?? 0 },
    { metric: "Career", value: dashboard?.scores.careerScore ?? 0 },
    { metric: "Learning", value: dashboard?.scores.learningScore ?? 0 },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scoreRows), "scores");

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet((yearData.goals ?? []).map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status ?? (g.done ? "done" : "active"),
      progress: g.progress ?? 0,
      due: g.due ?? g.targetDate ?? "",
    }))),
    "goals"
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet((yearData.tasks ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority ?? "",
      dueDate: t.dueDate ?? "",
    }))),
    "tasks"
  );

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as Uint8Array;
}
