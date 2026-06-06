import type { Exercise, Food } from "@/types/lifeos";

export const DEFAULT_FOODS: Food[] = [
  { id: "f1", name: "أرز كريمة", calories: 380, protein: 7, carbs: 84, fats: 1, serving: "100جم" },
  { id: "f2", name: "زيت زيتون", calories: 120, protein: 0, carbs: 0, fats: 14, serving: "1 ملعقة" },
  { id: "f3", name: "مكسرات مشكلة", calories: 180, protein: 6, carbs: 6, fats: 16, serving: "30جم" },
  { id: "f4", name: "دجاج مشوي", calories: 165, protein: 31, carbs: 0, fats: 4, serving: "100جم" },
  { id: "f5", name: "بيض كامل", calories: 78, protein: 6, carbs: 0.6, fats: 5, serving: "1 بيضة" },
  { id: "f6", name: "موز", calories: 105, protein: 1.3, carbs: 27, fats: 0.4, serving: "1 حبة" },
  { id: "f7", name: "شوفان بالحليب", calories: 350, protein: 14, carbs: 52, fats: 8, serving: "وجبة" },
];

export const DEFAULT_EXERCISES: Exercise[] = [
  { id: "e1", name: "Bench Press", muscleGroup: "صدر", equipment: "بار" },
  { id: "e2", name: "Incline DB Press", muscleGroup: "صدر", equipment: "دمبل" },
  { id: "e3", name: "Lat Pulldown", muscleGroup: "ظهر", equipment: "كابل" },
  { id: "e4", name: "Barbell Row", muscleGroup: "ظهر", equipment: "بار" },
  { id: "e5", name: "Squat", muscleGroup: "أرجل", equipment: "بار" },
  { id: "e6", name: "Romanian Deadlift", muscleGroup: "أرجل", equipment: "بار" },
  { id: "e7", name: "Overhead Press", muscleGroup: "كتف", equipment: "بار" },
  { id: "e8", name: "Lateral Raise", muscleGroup: "كتف", equipment: "دمبل" },
  { id: "e9", name: "Barbell Curl", muscleGroup: "ذراع", equipment: "بار" },
  { id: "e10", name: "Tricep Pushdown", muscleGroup: "ذراع", equipment: "كابل" },
];

export const PPLUL_PLAN = [
  { day: "الإثنين", label: "Push", focus: "صدر · كتف · ترايسبس" },
  { day: "الثلاثاء", label: "Pull", focus: "ظهر · بايسبس" },
  { day: "الأربعاء", label: "Legs", focus: "أرجل · glutes" },
  { day: "الخميس", label: "Upper", focus: "صدر · ظهر · كتف" },
  { day: "الجمعة", label: "Lower", focus: "أرجل · core" },
  { day: "السبت", label: "راحة / مشي", focus: "استشفاء" },
  { day: "الأحد", label: "راحة", focus: "استشفاء" },
];
