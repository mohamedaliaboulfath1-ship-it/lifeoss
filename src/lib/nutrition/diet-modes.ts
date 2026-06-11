export type DietMode = "bulk" | "cut" | "maintain" | "recomp";

export interface DietModePreset {
  id: DietMode;
  label: string;
  labelAr: string;
  description: string;
  caloriesMultiplier: number;
  proteinPerKg: number;
  carbsRatio: number;
  fatsRatio: number;
}

export const DIET_MODES: DietModePreset[] = [
  {
    id: "bulk",
    label: "Weight Gain",
    labelAr: "زيادة وزن",
    description: "فائض سعرات + بروتين عالي للبناء",
    caloriesMultiplier: 1.15,
    proteinPerKg: 2.0,
    carbsRatio: 0.45,
    fatsRatio: 0.25,
  },
  {
    id: "cut",
    label: "Cutting",
    labelAr: "تنشيف",
    description: "عجز معتدل مع الحفاظ على العضلات",
    caloriesMultiplier: 0.82,
    proteinPerKg: 2.2,
    carbsRatio: 0.35,
    fatsRatio: 0.30,
  },
  {
    id: "maintain",
    label: "Maintenance",
    labelAr: "ثبات",
    description: "سعرات الصيانة مع توازن الماكروز",
    caloriesMultiplier: 1.0,
    proteinPerKg: 1.8,
    carbsRatio: 0.40,
    fatsRatio: 0.28,
  },
  {
    id: "recomp",
    label: "Recomposition",
    labelAr: "إعادة تشكيل",
    description: "بروتين عالي + تمرين قوة",
    caloriesMultiplier: 0.95,
    proteinPerKg: 2.1,
    carbsRatio: 0.38,
    fatsRatio: 0.27,
  },
];

export function calcMacrosFromMode(
  mode: DietMode,
  weightKg: number,
  baseCalories = 2500
): { calories: number; protein: number; carbs: number; fats: number } {
  const preset = DIET_MODES.find((m) => m.id === mode) ?? DIET_MODES[2];
  const calories = Math.round(baseCalories * preset.caloriesMultiplier);
  const protein = Math.round(weightKg * preset.proteinPerKg);
  const proteinCal = protein * 4;
  const remaining = Math.max(0, calories - proteinCal);
  const carbs = Math.round((remaining * preset.carbsRatio) / 4);
  const fats = Math.round((remaining * preset.fatsRatio) / 9);
  return { calories, protein, carbs, fats };
}

export function calcMacroAdherence(
  actual: { cal: number; p: number; c: number; f: number },
  targets: { calories: number; protein: number; carbs: number; fats: number }
): number {
  const scores = [
    Math.min(100, (actual.cal / Math.max(1, targets.calories)) * 100),
    Math.min(100, (actual.p / Math.max(1, targets.protein)) * 100),
    Math.min(100, (actual.c / Math.max(1, targets.carbs)) * 100),
    Math.min(100, (actual.f / Math.max(1, targets.fats)) * 100),
  ];
  const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
  const penalty = actual.cal > targets.calories * 1.15 ? 10 : 0;
  return Math.round(Math.max(0, Math.min(100, avg - penalty)));
}
