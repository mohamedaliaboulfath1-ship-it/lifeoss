"use client";

import { KpiCard } from "@/components/ui/kpi-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CountUp } from "@/components/ui/count-up";
import { commas } from "@/lib/utils";
import type { YearPayload } from "@/types/lifeos";
import type { DashboardSnapshot } from "@/types/lifeos-pro";
import { HabitsToday } from "@/components/dashboard/command-center/habits-today";
import { CareerPanel } from "@/components/dashboard/command-center/career-panel";
import Link from "next/link";
import { MiniChart } from "@/components/ui/mini-chart";
import { StaggerGrid, StaggerItem } from "@/components/motion/stagger";
import { ProjectCommandCenter } from "@/components/dashboard/project-command-center";

interface Profile {
  displayName: string;
  startWeight?: number | null;
  targetWeight?: number | null;
}

interface DashboardViewProps {
  profile: Profile;
  yearData: YearPayload;
  dashboard?: DashboardSnapshot | null;
  onRefresh?: () => void;
}

export function DashboardView({
  profile,
  yearData,
  dashboard,
  onRefresh,
}: DashboardViewProps) {
  if (!dashboard) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 skeleton-shimmer rounded-[10px]" />
        <div className="h-40 skeleton-shimmer rounded-[10px]" />
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 skeleton-shimmer rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  const { weight, nutrition, workouts, finance, scores } = dashboard;
  const lifeScore = scores.lifeScore ?? 0;

  return (
    <StaggerGrid className="space-y-5">
      {/* ── Header + Life Score ── */}
      <StaggerItem>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[26px] font-black mb-1">{dashboard.greeting}</h2>
          <p className="text-text3 text-[13px]">{dashboard.subtitle}</p>
          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className="text-text3">تقدّم السنة</span>
            <div className="flex-1 max-w-[140px] h-1.5 bg-surface2 rounded overflow-hidden">
              <div
                className="h-full bg-gold rounded"
                style={{ width: `${dashboard.yearProgress ?? 0}%` }}
              />
            </div>
            <span className="font-mono text-gold2">{dashboard.yearProgress ?? 0}%</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LifeScoreRing score={lifeScore} />
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <ScorePill label="انضباط" value={scores.disciplineScore} color="var(--gold)" />
            <ScorePill label="صحة" value={scores.healthScore} color="var(--emerald)" />
            <ScorePill label="مال" value={scores.financeScore} color="var(--amber2)" />
            <ScorePill label="مهنة" value={scores.careerScore} color="var(--sky)" />
          </div>
        </div>
      </div>
      </StaggerItem>

      {/* ── Alerts badge ── */}
      {(dashboard.counts?.unreadNotifications ?? 0) > 0 && (
      <StaggerItem>
        <Card className="p-3 border-amber2/30 bg-amber2/5 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-bold text-amber2">🔔 {dashboard.counts.unreadNotifications} تنبيه</span>
            <span className="text-text3 mr-2">— تحقق من الإشعارات غير المقروءة</span>
          </div>
          <Link href="/account/notifications" className="text-xs text-gold2 hover:underline shrink-0">
            عرض →
          </Link>
        </Card>
      </StaggerItem>
      )}

      {/* ── TOP 5 PRIORITIES — 30 second answer ── */}
      <StaggerItem>
      <Card className="p-4 border-gold/40 bg-gradient-to-br from-gold/[0.06] to-transparent">
          <h3 className="text-sm font-bold text-gold2 mb-3">⚡ ماذا تفعل الآن؟</h3>
          {dashboard.priorities.length === 0 ? (
            <div className="text-sm text-text3 space-y-2 py-2">
              <p>لا أولويات عاجلة — رائع! ابدأ بـ:</p>
              <div className="flex flex-wrap gap-2">
                <Link href="/habits" className="text-xs px-2 py-1 rounded-sm bg-surface2 border border-border hover:border-gold/40">✅ العادات</Link>
                <Link href="/tasks" className="text-xs px-2 py-1 rounded-sm bg-surface2 border border-border hover:border-gold/40">📋 المهام</Link>
                <Link href="/goals" className="text-xs px-2 py-1 rounded-sm bg-surface2 border border-border hover:border-gold/40">🎯 الأهداف</Link>
              </div>
            </div>
          ) : (
          <div className="space-y-2">
            {dashboard.priorities.map((p) => (
              <Link
                key={`${p.type}-${p.entityId ?? p.rank}`}
                href={p.actionUrl}
                className="flex items-center gap-3 p-3 rounded-sm bg-surface2/90 border border-border hover:border-gold/50 transition-all group"
              >
                <span className="w-7 h-7 rounded-full bg-gold/15 text-gold2 font-bold text-sm flex items-center justify-center shrink-0">
                  {p.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate group-hover:text-gold2 transition-colors">
                    {p.title}
                  </div>
                  {p.subtitle && (
                    <div className="text-[11px] text-text3 truncate">{p.subtitle}</div>
                  )}
                </div>
                <UrgencyBadge urgency={p.urgency} />
              </Link>
            ))}
          </div>
          )}
        </Card>
      </StaggerItem>

      <StaggerItem>
        <ProjectCommandCenter dashboard={dashboard} yearData={yearData} />
      </StaggerItem>

      {/* ── هذا الأسبوع + قريباً ── */}
      <StaggerItem>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-emerald/20">
          <CardHeader>
            <CardTitle>📈 ما تحسّن هذا الأسبوع؟</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-sm bg-surface2/60 border border-border">
                <div className="text-2xl font-black text-emerald">
                  <CountUp value={dashboard.weekSummary.habitPct} suffix="%" />
                </div>
                <div className="text-[10px] text-text3 mt-1">انضباط العادات</div>
              </div>
              <div className="p-3 rounded-sm bg-surface2/60 border border-border">
                <div className="text-2xl font-black text-sky">
                  <CountUp value={dashboard.weekSummary.workoutsDays} />
                  <span className="text-sm text-text3">/{dashboard.weekSummary.workoutsTarget}</span>
                </div>
                <div className="text-[10px] text-text3 mt-1">أيام تمرين</div>
              </div>
              <div className="p-3 rounded-sm bg-surface2/60 border border-border">
                <div className="text-2xl font-black text-gold2">
                  <CountUp value={dashboard.weekSummary.goalsAvgProgress} suffix="%" />
                </div>
                <div className="text-[10px] text-text3 mt-1">متوسط الأهداف</div>
              </div>
            </div>
            <MiniChart
              type="bar"
              color="var(--emerald)"
              height={100}
              data={[
                { label: "عادات", value: dashboard.weekSummary.habitPct },
                { label: "تمارين", value: Math.round((dashboard.weekSummary.workoutsDays / dashboard.weekSummary.workoutsTarget) * 100) },
                { label: "أهداف", value: dashboard.weekSummary.goalsAvgProgress },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>⏳ ما يقترب موعده؟</CardTitle>
            <Link href="/tasks" className="text-[11px] text-gold2 hover:underline">
              المهام
            </Link>
          </CardHeader>
          <CardBody className="!py-2 space-y-1 max-h-52 overflow-y-auto">
            {dashboard.tasksDueSoon.length === 0 ? (
              <p className="text-text3 text-sm py-6 text-center">لا مواعيد خلال 7 أيام — خطّط مسبقاً</p>
            ) : (
              dashboard.tasksDueSoon.map((t) => (
                <Link
                  key={t.id}
                  href="/tasks"
                  className="flex items-center gap-3 p-2.5 rounded-sm bg-surface2/50 hover:bg-surface2 hover:border-gold/30 border border-transparent transition-all"
                >
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  {t.dueDate && (
                    <span className="text-[10px] font-mono text-amber2 shrink-0">{t.dueDate}</span>
                  )}
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
      </StaggerItem>

      {/* ── Habits + Tasks ── */}
      <StaggerItem>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HabitsToday habits={dashboard.todayHabits} />

        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>✅ مهام اليوم</CardTitle>
            <Link href="/tasks" className="text-[11px] text-gold2 hover:underline">
              الكل
            </Link>
          </CardHeader>
          <CardBody className="!py-2 space-y-1 max-h-64 overflow-y-auto">
            {dashboard.tasksDueToday.length === 0 ? (
              <p className="text-text3 text-sm py-4 text-center">✨ لا مهام مستحقة اليوم</p>
            ) : (
              dashboard.tasksDueToday.map((t) => (
                <Link
                  key={t.id}
                  href="/tasks"
                  className="flex items-center gap-3 p-2.5 rounded-sm bg-surface2/50 hover:bg-surface2 transition-colors"
                >
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      t.priority === "p1"
                        ? "bg-coral/20 text-coral"
                        : t.priority === "p2"
                          ? "bg-amber2/20 text-amber2"
                          : "bg-border text-text3"
                    }`}
                  >
                    {t.priority?.toUpperCase()}
                  </span>
                  <span className="text-sm flex-1 truncate">{t.title}</span>
                  {t.dueDate && (
                    <span className="text-[10px] text-text3">{t.dueDate}</span>
                  )}
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>
      </StaggerItem>

      {/* ── At-risk goals ── */}
      <StaggerItem>
        <Card className="border-coral/20">
          <CardHeader>
            <CardTitle>🚨 أهداف تحتاج اهتماماً</CardTitle>
          </CardHeader>
          <CardBody className="!py-3 space-y-2">
            {dashboard.atRiskGoals.length === 0 ? (
              <p className="text-text3 text-sm text-center py-2">✨ لا أهداف متأخرة حالياً</p>
            ) : dashboard.atRiskGoals.map((g) => (
              <Link
                key={g.id}
                href="/goals"
                className="flex items-center gap-3 p-3 rounded-sm bg-coral/[0.04] border border-coral/15 hover:border-coral/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{g.title}</div>
                  <div className="text-[11px] text-text3">{g.probabilityText}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-mono text-coral">{g.progress}%</div>
                  {g.daysLeft != null && (
                    <div className="text-[10px] text-text3">{g.daysLeft} يوم</div>
                  )}
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </StaggerItem>

      {/* ── Body · Nutrition · Workouts · Finance KPIs ── */}
      <StaggerItem>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="⚖️ الوزن"
          value={weight.current ? `${weight.current} كجم` : "لم يُسجّل بعد"}
          sub={`الهدف: ${weight.target ?? 75} كجم`}
          color="var(--gold)"
          badge={weight.progressPct ? `${weight.progressPct}%` : undefined}
        />
        <KpiCard
          label="🍽️ السعرات اليوم"
          value={`${Math.round(nutrition.calories)}`}
          numericValue={Math.round(nutrition.calories)}
          sub={`/${nutrition.calorieTarget} · بروتين ${Math.round(nutrition.protein)}جم`}
          color="var(--amber2)"
          badge={
            nutrition.calories > 0
              ? `${Math.round((nutrition.calories / nutrition.calorieTarget) * 100)}%`
              : undefined
          }
        />
        <KpiCard
          label="🏋️ تمارين الأسبوع"
          value={`${workouts.uniqueDays} / ${workouts.weekTarget}`}
          numericValue={workouts.uniqueDays}
          suffix={` / ${workouts.weekTarget}`}
          sub={`${workouts.weekSessions} مجموعة · أيام تمرين`}
          color="var(--sky)"
        />
        <KpiCard
          label="💰 الوضع المالي"
          value={`${commas(finance.netMonth)} ﷼`}
          sub={`ادّخار: ${commas(finance.totalSavings)} · ${finance.activeDebts} ديون`}
          color="var(--emerald)"
        />
      </div>
      </StaggerItem>

      {/* Macro progress */}
      <StaggerItem>
      <Card className="p-4">
        <div className="text-xs font-bold text-text3 mb-3">🍽️ ماكروز اليوم مقابل الهدف</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MacroBar label="سعرات" current={nutrition.calories} target={nutrition.calorieTarget} color="var(--gold)" />
          <MacroBar label="بروتين" current={nutrition.protein} target={nutrition.proteinTarget} color="var(--emerald)" unit="جم" />
          <MacroBar label="كارب" current={nutrition.carbs} target={nutrition.carbsTarget} color="var(--sky)" unit="جم" />
          <MacroBar label="دهون" current={nutrition.fats} target={nutrition.fatsTarget} color="var(--amber2)" unit="جم" />
        </div>
      </Card>
      </StaggerItem>

      {/* ── Life domains gallery ── */}
      {(dashboard.domains?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🗺️ المناطق الحياتية</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {dashboard.domains.map((d) => (
                <Link
                  key={d.domainId}
                  href={
                    d.slug === "body"
                      ? "/body"
                      : d.slug === "finance"
                        ? "/finance"
                        : d.slug === "career"
                          ? "/career"
                          : d.slug === "learning"
                            ? "/learning"
                            : "/goals"
                  }
                  className="p-4 rounded-sm border border-border bg-surface2/50 hover:border-gold/40 transition-all text-center"
                >
                  <div className="text-3xl mb-2">{d.icon ?? "🎯"}</div>
                  <div className="text-sm font-bold">{d.nameAr}</div>
                  <div className="text-[11px] text-text3 mt-1 truncate">{d.headline}</div>
                  {typeof d.score === "number" && (
                    <div className="mt-2">
                      <ProgressBar value={d.score} color="var(--gold)" />
                      <div className="text-[10px] font-mono text-gold2 mt-1">{d.score}%</div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Career & Learning ── */}
      <CareerPanel career={dashboard.career} />

      {/* ── Smart Insights ── */}
      <Card>
        <CardHeader>
          <CardTitle>💡 رؤى ذكية — قابلة للتنفيذ</CardTitle>
        </CardHeader>
        <CardBody className="!py-3 space-y-2">
          {dashboard.insights.length === 0 ? (
            <p className="text-text3 text-sm text-center py-2">أضف عادات ومهام لتحصل على رؤى مخصّصة</p>
          ) : dashboard.insights.map((ins) => (
            <Link
              key={ins.id}
              href={ins.actionUrl}
              className="flex items-center gap-3 p-3 rounded-sm border border-border hover:border-gold/30 bg-surface2/40 transition-colors"
            >
              <span className="text-xl">{ins.icon}</span>
              <span className="flex-1 text-sm">{ins.message}</span>
              <span className="text-[11px] text-gold2 shrink-0">{ins.action} →</span>
            </Link>
          ))}
        </CardBody>
      </Card>

      {/* Active goals quick view */}
      {(yearData.goals ?? []).length > 0 && (
        <Card>
          <CardHeader className="flex flex-row justify-between">
            <CardTitle>🎯 أهداف نشطة</CardTitle>
            <Link href="/goals" className="text-[11px] text-gold2">عرض الكل</Link>
          </CardHeader>
          <CardBody className="space-y-2">
            {(yearData.goals ?? []).slice(0, 4).map((g) => {
              const pct = g.done ? 100 : parseInt(g.current ?? "0", 10) || 0;
              return (
                <div key={g.id} className="flex items-center gap-3">
                  <span className="text-sm w-40 truncate">{g.title}</span>
                  <ProgressBar value={pct} color="var(--gold)" className="flex-1" />
                  <span className="text-[11px] font-mono text-text3 w-8">{pct}%</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      )}
    </StaggerGrid>
  );
}

function LifeScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--gold)"
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-gold2">
          <CountUp value={score} />
        </span>
        <span className="text-[9px] text-text3">Life Score</span>
      </div>
    </div>
  );
}

function ScorePill({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      <span className="text-text3">{label}</span>
      <span className="font-mono font-bold" style={{ color }}>{value ?? "—"}</span>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-coral/20 text-coral",
    high: "bg-amber2/20 text-amber2",
    normal: "bg-border text-text3",
    low: "bg-border text-text3",
  };
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase ${styles[urgency] ?? styles.normal}`}>
      {urgency}
    </span>
  );
}

function MacroBar({
  label,
  current,
  target,
  color,
  unit = "",
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit?: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-text3">{label}</span>
        <span className="font-mono">
          {Math.round(current)}{unit} / {target}{unit}
        </span>
      </div>
      <ProgressBar value={pct} color={color} />
    </div>
  );
}
