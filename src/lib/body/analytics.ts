import type { Measurement, WeightLog } from "@/types/lifeos";
import type { BodyAnalytics } from "@/types/para";
import { resolveCurrentWeight, weightForecast } from "@/lib/body/weight-forecast";

const AREA_KEYS = ["chest", "arm", "waist", "thigh", "calf"] as const;
const AREA_LABELS: Record<string, string> = {
  chest: "الصدر",
  arm: "الذراع",
  waist: "الخصر",
  thigh: "الفخذ",
  calf: "السمانة",
};

const EMPTY: BodyAnalytics = {
  currentWeight: null,
  targetWeight: 75,
  startWeight: null,
  difference: null,
  weeklyGainRate: null,
  forecastDate: null,
  bmi: null,
  bmiLabel: "—",
  leanMass: null,
  fatMass: null,
  progressPct: 0,
  stagnantWeeks: 0,
  bestImprovedArea: null,
  laggingArea: null,
  monthlyGrowthRate: {},
  hasWeight: false,
};

export function buildBodyAnalytics(input: {
  weightLogs: WeightLog[];
  measurements: Measurement[];
  startWeight?: number | null;
  targetWeight: number;
  heightCm?: number | null;
  currentWeightOverride?: number | null;
  weeklyGainTarget?: number;
}): BodyAnalytics {
  const logs = [...input.weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const latest = logs[logs.length - 1];
  const current = resolveCurrentWeight({
    latestLog: latest?.weight,
    profileCurrent: input.currentWeightOverride,
  });

  if (current == null) {
    return { ...EMPTY, targetWeight: input.targetWeight, hasWeight: false };
  }

  const start = input.startWeight ?? logs[0]?.weight ?? current;
  const target = input.targetWeight;
  const difference = Math.round((target - current) * 10) / 10;

  const weeklyGainRate =
    logs.length >= 2
      ? Math.round((logs[logs.length - 1].weight - logs[logs.length - 2].weight) * 10) / 10
      : logs.length >= 4
        ? Math.round(
            ((logs[logs.length - 1].weight - logs[Math.max(0, logs.length - 4)].weight) / 3) * 10
          ) / 10
        : null;

  const rate = weeklyGainRate && weeklyGainRate > 0 ? weeklyGainRate : (input.weeklyGainTarget ?? 0.5);
  const forecast = weightForecast({ current, target, start, weeklyRate: rate });
  const forecastDate = forecast.forecastDate;

  const heightM = input.heightCm ? input.heightCm / 100 : null;
  const bmi = heightM && heightM > 0 ? current / (heightM * heightM) : null;
  const bmiLabel =
    bmi == null ? "—" : bmi < 18.5 ? "نقص وزن" : bmi < 25 ? "طبيعي" : "فوق الطبيعي";

  const latestMeasure = [...input.measurements].sort((a, b) => b.date.localeCompare(a.date))[0];
  const bodyFat = latestMeasure?.bodyFat ?? (latestMeasure as Measurement & { body_fat?: number })?.body_fat;
  const fatMass = bodyFat != null ? Math.round(current * (bodyFat / 100) * 10) / 10 : null;
  const leanMass = fatMass != null ? Math.round((current - fatMass) * 10) / 10 : null;

  const progressPct =
    target !== start
      ? Math.max(0, Math.min(100, Math.round(((current - start) / (target - start)) * 100)))
      : 0;

  let stagnantWeeks = 0;
  if (logs.length >= 2) {
    const last = logs[logs.length - 1].weight;
    for (let i = logs.length - 2; i >= 0; i--) {
      if (Math.abs(logs[i].weight - last) < 0.2) stagnantWeeks++;
      else break;
    }
    stagnantWeeks = Math.floor(stagnantWeeks / 7);
  }

  const monthlyGrowthRate: Record<string, number> = {};
  const sortedMeasures = [...input.measurements].sort((a, b) => a.date.localeCompare(b.date));
  if (sortedMeasures.length >= 2) {
    const first = sortedMeasures[0];
    const last = sortedMeasures[sortedMeasures.length - 1];
    const months = Math.max(
      1,
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / (30 * 86400000)
    );
    const vals = (m: Measurement) => ({
      chest: m.chest,
      arm: m.arm,
      waist: m.waist,
      thigh: m.thigh,
      calf: m.calf,
    });
    const f = vals(first);
    const l = vals(last);
    for (const key of AREA_KEYS) {
      const a = f[key];
      const b = l[key];
      if (a != null && b != null) {
        monthlyGrowthRate[AREA_LABELS[key]] = Math.round(((b - a) / months) * 10) / 10;
      }
    }
  }

  let bestImprovedArea: string | null = null;
  let laggingArea: string | null = null;
  let bestDelta = -Infinity;
  let worstDelta = Infinity;
  for (const [label, rate] of Object.entries(monthlyGrowthRate)) {
    if (rate > bestDelta) {
      bestDelta = rate;
      bestImprovedArea = label;
    }
    if (rate < worstDelta) {
      worstDelta = rate;
      laggingArea = label;
    }
  }

  return {
    currentWeight: current,
    targetWeight: target,
    startWeight: start,
    difference,
    weeklyGainRate,
    forecastDate,
    forecastWeeks: forecast.weeks,
    bmi: bmi != null ? Math.round(bmi * 10) / 10 : null,
    bmiLabel,
    leanMass,
    fatMass,
    progressPct: forecast.progressPct,
    stagnantWeeks,
    bestImprovedArea,
    laggingArea,
    monthlyGrowthRate,
    hasWeight: true,
  };
}
