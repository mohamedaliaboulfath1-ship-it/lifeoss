import type { FocusScoreBreakdown } from "@/types/time";

type BlockRow = { status: string; block_type: string; start_at: string; end_at: string };
type SessionRow = { duration_minutes: number; interrupted: boolean; session_type: string };

export function calcFocusScore(
  blocks: BlockRow[],
  sessions: SessionRow[]
): FocusScoreBreakdown {
  const planned = blocks.filter((b) => b.status !== "missed");
  const done = blocks.filter((b) => b.status === "done");
  const deepBlocks = blocks.filter((b) => b.block_type === "deep_work");
  const deepDone = deepBlocks.filter((b) => b.status === "done");

  const blockAdherencePct =
    planned.length > 0 ? Math.round((done.length / planned.length) * 100) : 50;
  const deepWorkPct =
    deepBlocks.length > 0 ? Math.round((deepDone.length / deepBlocks.length) * 100) : 50;

  const plannedMins = planned.reduce((s, b) => {
    const start = new Date(b.start_at).getTime();
    const end = new Date(b.end_at).getTime();
    return s + Math.max(0, (end - start) / 60000);
  }, 0);
  const sessionMins = sessions.reduce((s, x) => s + x.duration_minutes, 0);
  const planAdherencePct =
    plannedMins > 0 ? Math.min(100, Math.round((sessionMins / plannedMins) * 100)) : 50;

  const interruptions = sessions.filter((s) => s.interrupted).length;
  const interruptionPenalty = Math.min(25, interruptions * 5);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        deepWorkPct * 0.35 +
          blockAdherencePct * 0.35 +
          planAdherencePct * 0.2 -
          interruptionPenalty +
          10
      )
    )
  );

  const reasons: string[] = [];
  if (deepWorkPct >= 70) reasons.push(`Deep Work: ${deepWorkPct}%`);
  if (blockAdherencePct < 60) reasons.push("التزام بالخطة يحتاج تحسين");
  if (interruptions > 0) reasons.push(`${interruptions} مقاطعات هذا الأسبوع`);
  if (score >= 75) reasons.push("تركيز قوي");

  return { score, deepWorkPct, blockAdherencePct, planAdherencePct, interruptionPenalty, reasons };
}

export function buildHeatmap(
  dailyMinutes: Record<string, number>,
  days: string[]
): { date: string; minutes: number; level: 0 | 1 | 2 | 3 | 4 }[] {
  const max = Math.max(1, ...Object.values(dailyMinutes));
  return days.map((date) => {
    const minutes = dailyMinutes[date] ?? 0;
    const ratio = minutes / max;
    const level = (ratio >= 0.8 ? 4 : ratio >= 0.6 ? 3 : ratio >= 0.35 ? 2 : ratio > 0 ? 1 : 0) as 0 | 1 | 2 | 3 | 4;
    return { date, minutes, level };
  });
}
