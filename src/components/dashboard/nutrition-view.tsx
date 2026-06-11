"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { Input, Label } from "@/components/ui/input";
import { MiniChart } from "@/components/ui/mini-chart";
import { today, uid } from "@/lib/utils";
import { DIET_MODES, calcMacroAdherence, calcMacrosFromMode, type DietMode } from "@/lib/nutrition/diet-modes";
import type { MealLog, YearPayload } from "@/types/lifeos";

type MealTemplate = { id: string; name: string; calories: number; protein: number; carbs: number; fats: number };

interface NutritionViewProps {
  yearData: YearPayload;
  targets?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  };
  bodyPlan?: { dietPlan?: string; dietNotes?: string };
  bodyGoal?: string;
  currentWeight?: number;
  onEditPlan?: () => void;
  onRefresh: () => void;
}

const BODY_GOAL_TO_MODE: Record<string, DietMode> = {
  gain: "bulk",
  lose: "cut",
  maintain: "maintain",
  recomp: "recomp",
  athletic: "recomp",
};

export function NutritionView({ yearData, targets, bodyPlan, bodyGoal, currentWeight = 70, onEditPlan, onRefresh }: NutritionViewProps) {
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [dietMode, setDietMode] = useState<DietMode>(BODY_GOAL_TO_MODE[bodyGoal ?? "gain"] ?? "bulk");
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lifeos_meal_templates");
      if (raw) setMealTemplates(JSON.parse(raw) as MealTemplate[]);
    } catch { /* ignore */ }
  }, []);

  const modeMacros = useMemo(
    () => calcMacrosFromMode(dietMode, currentWeight, targets?.calories ?? 2500),
    [dietMode, currentWeight, targets?.calories]
  );

  const targetCal = targets?.calories ?? modeMacros.calories;
  const targetP = targets?.protein ?? 130;
  const targetC = targets?.carbs ?? 350;
  const targetF = targets?.fats ?? 90;

  const foods = yearData.foods ?? [];
  const mealLogs = yearData.mealLogs ?? [];
  const t = today();

  const todayLogs = useMemo(
    () => mealLogs.filter((l) => l.date === t),
    [mealLogs, t]
  );

  const totals = useMemo(() => {
    return todayLogs.reduce(
      (s, l) => ({
        cal: s.cal + l.calories,
        p: s.p + l.protein,
        c: s.c + l.carbs,
        f: s.f + l.fats,
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  }, [todayLogs]);

  const [foodId, setFoodId] = useState(foods[0]?.id ?? "");
  const [mealName, setMealName] = useState("وجبة مخصّصة");
  const [foodForm, setFoodForm] = useState({
    id: "",
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
    serving: "",
  });

  const filteredFoods = useMemo(
    () => foods.filter((f) => f.name.toLowerCase().includes(query.toLowerCase())),
    [foods, query]
  );

  const weeklyReport = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const perDay: Record<string, { c: number; p: number; carbs: number; f: number }> = {};
    mealLogs.forEach((l) => {
      if (l.date >= start.toISOString().slice(0, 10)) {
        if (!perDay[l.date]) perDay[l.date] = { c: 0, p: 0, carbs: 0, f: 0 };
        perDay[l.date].c += l.calories;
        perDay[l.date].p += l.protein;
        perDay[l.date].carbs += l.carbs;
        perDay[l.date].f += l.fats;
      }
    });
    const ordered = Object.entries(perDay).sort((a, b) => a[0].localeCompare(b[0]));
    return {
      calories: ordered.map(([d, v]) => ({ label: d.slice(5), value: Math.round(v.c) })),
      protein: ordered.map(([d, v]) => ({ label: d.slice(5), value: Math.round(v.p) })),
      carbs: ordered.map(([d, v]) => ({ label: d.slice(5), value: Math.round(v.carbs) })),
      fats: ordered.map(([d, v]) => ({ label: d.slice(5), value: Math.round(v.f) })),
    };
  }, [mealLogs]);

  async function logMeal() {
    const food = foods.find((f) => f.id === foodId);
    if (!food) return;
    const log: MealLog = {
      id: uid(),
      date: t,
      foodName: food.name,
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    };
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "meal", payload: log }),
    });
    onRefresh();
  }

  async function saveMealBuilder() {
    const food = foods.find((f) => f.id === foodId);
    if (!food) return;
    const log: MealLog = {
      id: uid(),
      date: t,
      mealName,
      foodName: food.name,
      time: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
    };
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "meal", payload: log }),
    });
    setModal(false);
    onRefresh();
  }

  async function removeLog(id: string) {
    await fetch(`/api/nutrition?entity=meal&id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  async function saveFood() {
    if (!foodForm.name.trim()) return;
    const nextFoods = [...foods];
    const item = {
      id: foodForm.id || uid(),
      name: foodForm.name,
      calories: Number(foodForm.calories) || 0,
      protein: Number(foodForm.protein) || 0,
      carbs: Number(foodForm.carbs) || 0,
      fats: Number(foodForm.fats) || 0,
      serving: foodForm.serving || undefined,
    };
    const idx = nextFoods.findIndex((f) => f.id === item.id);
    if (idx >= 0) nextFoods[idx] = item;
    else nextFoods.push(item);
    await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "food", payload: item }),
    });
    setFoodForm({ id: "", name: "", calories: "", protein: "", carbs: "", fats: "", serving: "" });
    onRefresh();
  }

  async function removeFood(id: string) {
    await fetch(`/api/nutrition?entity=food&id=${id}`, { method: "DELETE" });
    onRefresh();
  }

  const nutritionScore = useMemo(
    () => calcMacroAdherence(totals, { calories: targetCal, protein: targetP, carbs: targetC, fats: targetF }),
    [totals, targetCal, targetP, targetC, targetF]
  );

  function saveMealTemplate() {
    const tpl: MealTemplate = {
      id: uid(),
      name: mealName,
      calories: totals.cal || (foods.find((f) => f.id === foodId)?.calories ?? 0),
      protein: totals.p || (foods.find((f) => f.id === foodId)?.protein ?? 0),
      carbs: totals.c || (foods.find((f) => f.id === foodId)?.carbs ?? 0),
      fats: totals.f || (foods.find((f) => f.id === foodId)?.fats ?? 0),
    };
    const next = [...mealTemplates, tpl];
    setMealTemplates(next);
    localStorage.setItem("lifeos_meal_templates", JSON.stringify(next));
  }

  const insights = [];
  if (totals.cal < targetCal * 0.7)
    insights.push({ type: "warning", title: "سعرات منخفضة", msg: "أضف زيت زيتون أو مكسرات" });
  if (totals.p < targetP * 0.6)
    insights.push({ type: "warning", title: "بروتين ناقص", msg: "زِد الدجاج أو البيض" });
  if (nutritionScore < 60)
    insights.push({ type: "warning", title: "التزام منخفض", msg: `Nutrition Score: ${nutritionScore}% — حاول الوصول لـ 80%+` });

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="🍽️ التغذية"
        subtitle={`الهدف اليومي: ${targetCal} سعرة · ${targetP}جم بروتين`}
        actionLabel="+ Meal Builder"
        onAction={() => setModal(true)}
      />

      <Card className="p-4 border-gold/25 bg-gold/5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-bold">{bodyPlan?.dietPlan ?? "خطتك الغذائية"}</div>
            <div className="text-xs text-text3">{bodyPlan?.dietNotes || "اختر وضع التغذية أو عدّل من صفحة الجسم"}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-text3">Nutrition Score</div>
            <div className="text-xl font-black text-gold2">{nutritionScore}%</div>
          </div>
          {onEditPlan && (
            <Button variant="ghost" size="sm" onClick={onEditPlan}>⚙️ تعديل الخطة</Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {DIET_MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setDietMode(m.id)}
              className={`px-3 py-1.5 rounded-sm text-xs border transition-colors ${
                dietMode === m.id
                  ? "border-gold bg-gold/15 text-gold2 font-bold"
                  : "border-border hover:bg-surface2"
              }`}
            >
              {m.labelAr}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-text3">
          {DIET_MODES.find((m) => m.id === dietMode)?.description} — مقترح: {modeMacros.calories} سعرة · {modeMacros.protein}جم بروتين
        </div>
      </Card>

      <Tabs
        tabs={[
          { id: "overview", label: "🏠 Overview" },
          { id: "foods", label: "🧾 Food DB" },
          { id: "analytics", label: "📊 Analytics" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="السعرات"
          value={`${Math.round(totals.cal)}/${targetCal}`}
          sub=""
          color="var(--gold)"
        />
        <KpiCard
          label="البروتين"
          value={`${Math.round(totals.p)}/${targetP}جم`}
          sub=""
          color="var(--rose)"
        />
        <KpiCard
          label="الكارب"
          value={`${Math.round(totals.c)}/${targetC}جم`}
          sub=""
          color="var(--sky)"
        />
        <KpiCard
          label="الدهون"
          value={`${Math.round(totals.f)}/${targetF}جم`}
          sub=""
          color="var(--purple)"
        />
      </div>

      {tab === "overview" && (
        <>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-bold text-gold2">إضافة سريعة</div>
            <select
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
              value={foodId}
              onChange={(e) => setFoodId(e.target.value)}
            >
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.calories} سعرة
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button variant="gold" size="sm" onClick={logMeal}>
                + تسجيل سريع
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setModal(true)}>
                Meal Builder
              </Button>
            </div>
            <ProgressBar
              value={Math.min(100, (totals.cal / targetCal) * 100)}
              color="var(--gold)"
            />
          </Card>

          {mealTemplates.length > 0 && (
            <Card className="p-4 space-y-2">
              <div className="text-sm font-bold text-gold2">وجبات مفضّلة</div>
              <div className="flex flex-wrap gap-2">
                {mealTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    className="px-3 py-1.5 rounded-sm border border-border text-xs hover:bg-surface2"
                    onClick={async () => {
                      await fetch("/api/nutrition", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          entity: "meal",
                          payload: {
                            id: uid(),
                            date: t,
                            mealName: tpl.name,
                            foodName: tpl.name,
                            calories: tpl.calories,
                            protein: tpl.protein,
                            carbs: tpl.carbs,
                            fats: tpl.fats,
                          },
                        }),
                      });
                      onRefresh();
                    }}
                  >
                    {tpl.name} · {tpl.calories} سعرة
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={saveMealTemplate}>💾 حفظ الوجبة الحالية كقالب</Button>
            </Card>
          )}
          {mealTemplates.length === 0 && (
            <Button variant="ghost" size="sm" onClick={saveMealTemplate}>💾 حفظ وجبة كقالب مفضّل</Button>
          )}

          <Card className="p-4">
            <div className="font-bold text-sm mb-3">وجبات اليوم ({todayLogs.length})</div>
            {todayLogs.length === 0 ? (
              <EmptyState icon="🍽️" title="لم تسجل وجبة اليوم" actionLabel="+ تسجيل" onAction={logMeal} />
            ) : (
              <ul className="space-y-2">
                {todayLogs.map((l) => (
                  <li
                    key={l.id}
                    className="flex justify-between items-center py-2 border-b border-border/50 text-sm"
                  >
                    <span>
                      {l.mealName ? `${l.mealName} · ` : ""}
                      {l.foodName} — {l.calories} سعرة · 🥩 {l.protein}جم
                    </span>
                    <Button variant="danger" size="sm" onClick={() => removeLog(l.id)}>
                      🗑
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {tab === "foods" && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="p-4 space-y-3">
            <div className="text-sm font-bold">Food Search + CRUD</div>
            <Input placeholder="ابحث عن طعام..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="max-h-72 overflow-auto space-y-2">
              {filteredFoods.map((f) => (
                <div key={f.id} className="p-2 rounded-sm border border-border2 bg-surface2 text-sm">
                  <div className="font-semibold">{f.name}</div>
                  <div className="text-xs text-text3">
                    {f.calories} kcal · P{f.protein} C{f.carbs} F{f.fats}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setFoodForm({
                          id: f.id,
                          name: f.name,
                          calories: String(f.calories),
                          protein: String(f.protein),
                          carbs: String(f.carbs),
                          fats: String(f.fats),
                          serving: f.serving || "",
                        })
                      }
                    >
                      تعديل
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => removeFood(f.id)}>
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-bold">Custom Food</div>
            <div>
              <Label>الاسم</Label>
              <Input value={foodForm.name} onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Calories</Label>
                <Input
                  type="number"
                  value={foodForm.calories}
                  onChange={(e) => setFoodForm({ ...foodForm, calories: e.target.value })}
                />
              </div>
              <div>
                <Label>Protein</Label>
                <Input
                  type="number"
                  value={foodForm.protein}
                  onChange={(e) => setFoodForm({ ...foodForm, protein: e.target.value })}
                />
              </div>
              <div>
                <Label>Carbs</Label>
                <Input
                  type="number"
                  value={foodForm.carbs}
                  onChange={(e) => setFoodForm({ ...foodForm, carbs: e.target.value })}
                />
              </div>
              <div>
                <Label>Fats</Label>
                <Input
                  type="number"
                  value={foodForm.fats}
                  onChange={(e) => setFoodForm({ ...foodForm, fats: e.target.value })}
                />
              </div>
            </div>
            <Button variant="gold" onClick={saveFood}>
              {foodForm.id ? "تحديث" : "+ إضافة"} طعام
            </Button>
          </Card>
        </div>
      )}

      {tab === "analytics" && (
        <div className="grid xl:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Macro Bars (Today)</div>
            <MiniChart
              data={[
                { label: "P", value: totals.p },
                { label: "C", value: totals.c },
                { label: "F", value: totals.f },
              ]}
              type="bar"
              color="var(--rose)"
            />
          </Card>
          <Card className="p-4">
            <div className="text-sm font-bold mb-3">Macro Donut (MVP Placeholder)</div>
            <div className="w-36 h-36 mx-auto rounded-full border-[14px] border-gold/60 relative">
              <div
                className="absolute inset-0 rounded-full border-[14px] border-transparent"
                style={{
                  borderTopColor: "var(--rose)",
                  borderRightColor: "var(--sky)",
                  borderBottomColor: "var(--emerald)",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs text-text3">Macros</div>
            </div>
          </Card>
          <Card className="p-4 xl:col-span-2">
            <div className="text-sm font-bold mb-3">Weekly Report</div>
            <div className="grid md:grid-cols-4 gap-3">
              <MiniChart data={weeklyReport.calories} type="bar" color="var(--gold)" />
              <MiniChart data={weeklyReport.protein} type="bar" color="var(--rose)" />
              <MiniChart data={weeklyReport.carbs} type="bar" color="var(--sky)" />
              <MiniChart data={weeklyReport.fats} type="bar" color="var(--emerald)" />
            </div>
          </Card>
        </div>
      )}

      {insights.map((i, idx) => (
        <div
          key={idx}
          className="p-3 rounded-sm border border-amber/30 bg-amber/10 text-amber2 text-sm"
        >
          <strong>{i.title}</strong> — {i.msg}
        </div>
      ))}

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-surface border border-border2 rounded-[10px] w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gold2">Meal Builder</h3>
            <div>
              <Label>اسم الوجبة</Label>
              <Input value={mealName} onChange={(e) => setMealName(e.target.value)} />
            </div>
            <div>
              <Label>اختر الطعام</Label>
              <select
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
                value={foodId}
                onChange={(e) => setFoodId(e.target.value)}
              >
                {foods.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.calories} kcal
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(false)}>
                إلغاء
              </Button>
              <Button variant="gold" onClick={saveMealBuilder}>
                حفظ الوجبة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
