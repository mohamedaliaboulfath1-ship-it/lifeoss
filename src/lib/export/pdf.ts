import { jsPDF } from "jspdf";
import type { DashboardSnapshot } from "@/types/lifeos-pro";

export function buildDashboardPdf(snapshot?: DashboardSnapshot | null): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const y0 = 50;
  let y = y0;
  doc.setFontSize(18);
  doc.text("Life OS Executive Report", 40, y);
  y += 28;

  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toISOString().slice(0, 10)}`, 40, y);
  y += 24;

  const lines = [
    `Life Score: ${snapshot?.scores.lifeScore ?? 0}`,
    `Discipline Score: ${snapshot?.scores.disciplineScore ?? 0}`,
    `Health Score: ${snapshot?.scores.healthScore ?? 0}`,
    `Finance Score: ${snapshot?.scores.financeScore ?? 0}`,
    `Career Score: ${snapshot?.scores.careerScore ?? 0}`,
    `Learning Score: ${snapshot?.scores.learningScore ?? 0}`,
    `Year Progress: ${snapshot?.yearProgress ?? 0}%`,
  ];

  lines.forEach((line) => {
    doc.text(line, 40, y);
    y += 18;
  });

  y += 10;
  doc.setFontSize(13);
  doc.text("Top Priorities", 40, y);
  y += 18;
  doc.setFontSize(11);
  (snapshot?.priorities ?? []).slice(0, 5).forEach((p, idx) => {
    doc.text(`${idx + 1}. ${p.title}`, 40, y);
    y += 16;
  });

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
