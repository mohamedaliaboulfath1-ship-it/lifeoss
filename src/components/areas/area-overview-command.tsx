"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { AreaHubPayload } from "@/types/areas";

interface Props {
  hub: AreaHubPayload;
  onNav: (tab: string) => void;
  onOpenGoal: (id: string) => void;
}

export function AreaOverviewCommand({ hub, onNav, onOpenGoal }: Props) {
  const a = hub.area;
  const topGoal = hub.goals[0];
  const topProject = hub.projects[0];
  const upcomingReview = hub.timeline.find((e) => e.period === "week" && e.icon === "🔄");

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Active Goal */}
        <Card className="p-4 glass-premium hover:shadow-md transition-shadow">
          <div className="text-xs text-text3 mb-1">الهدف النشط</div>
          {topGoal ? (
            <>
              <button type="button" onClick={() => onOpenGoal(topGoal.id)} className="text-sm font-bold text-right w-full hover:text-gold2">
                {topGoal.title}
              </button>
              <ProgressBar value={topGoal.progress} color={a.color} className="h-1.5 mt-2" />
              <div className="text-[10px] text-text3 mt-1">{topGoal.progress}% · {topGoal.completion?.probabilityText ?? topGoal.status}</div>
            </>
          ) : (
            <p className="text-text3 text-sm">لا أهداف — <Link href="/goals" className="text-gold2">أضف</Link></p>
          )}
        </Card>

        {/* Active Project */}
        <Card className="p-4 glass-premium hover:shadow-md transition-shadow">
          <div className="text-xs text-text3 mb-1">المشروع النشط</div>
          {topProject ? (
            <>
              <div className="text-sm font-bold">{topProject.title}</div>
              <ProgressBar value={topProject.progress} color="var(--sky)" className="h-1.5 mt-2" />
              <div className="text-[10px] text-text3 mt-1">{topProject.progress}%</div>
            </>
          ) : (
            <p className="text-text3 text-sm">—</p>
          )}
        </Card>

        {/* Domain metrics */}
        <Card className="p-4 glass-premium md:col-span-2 xl:col-span-1">
          <div className="text-xs text-text3 mb-2">مؤشرات المجال</div>
          <div className="flex flex-wrap gap-2">
            {hub.metrics.map((m) => (
              <span key={m.label} className="text-xs px-2 py-1 rounded-full bg-surface2 border border-border/40">
                {m.label}: <span className="font-mono font-bold">{m.value}</span>
              </span>
            ))}
            {!hub.metrics.length && <span className="text-text3 text-xs">لا مؤشرات خاصة</span>}
          </div>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniList
          title="🔄 العادات"
          count={hub.habits.length}
          items={hub.habits.slice(0, 5).map((h) => `${h.doneToday ? "✅" : "○"} ${h.name}`)}
          onMore={() => onNav("habits")}
        />
        <MiniList
          title="✅ المهام"
          count={hub.tasks.filter((t) => t.status !== "done").length}
          items={hub.tasksDueToday.slice(0, 4).map((t) => t.title)}
          onMore={() => onNav("tasks")}
        />
        <MiniList
          title="📚 الكتب"
          count={hub.books.current.length}
          items={hub.books.current.slice(0, 3).map((b) => `${b.title} ${b.progress}%`)}
          onMore={() => onNav("books")}
        />
        <MiniList
          title="🎓 التعلم"
          count={hub.courses.current.length + hub.certifications.current.length}
          items={[
            ...hub.courses.current.slice(0, 2).map((c) => c.title),
            ...hub.certifications.current.slice(0, 1).map((c) => c.name),
          ]}
          onMore={() => onNav("learn")}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 glass-premium">
          <div className="text-sm font-bold mb-2">📅 اليوم</div>
          {hub.timeline.filter((e) => e.period === "today").map((e) => (
            <div key={e.id} className="text-sm py-0.5">{e.icon} {e.text}</div>
          ))}
          {!hub.timeline.filter((e) => e.period === "today").length && (
            <p className="text-text3 text-xs">لا نشاط مسجّل اليوم</p>
          )}
        </Card>
        <Card className="p-4 glass-premium">
          <div className="text-sm font-bold mb-2">📆 المراجعة القادمة</div>
          {upcomingReview ? (
            <div className="text-sm">{upcomingReview.icon} {upcomingReview.text}</div>
          ) : (
            <p className="text-text3 text-xs">راجع عاداتك الأسبوعية من تبويب العادات</p>
          )}
          <button type="button" onClick={() => onNav("coach")} className="text-xs text-gold2 mt-2 hover:underline">
            توصيات المدرب →
          </button>
        </Card>
      </div>

      <Card className="p-4 glass-premium">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-bold">🧠 Area Coach</div>
          <button type="button" onClick={() => onNav("coach")} className="text-xs text-gold2">عرض الكل</button>
        </div>
        {hub.coach.slice(0, 2).map((c) => (
          <div key={c.id} className="text-sm p-2 rounded-lg bg-surface2/60 mb-1 border border-border/30">
            {c.icon} {c.message}
          </div>
        ))}
      </Card>
    </motion.div>
  );
}

function MiniList({
  title,
  count,
  items,
  onMore,
}: {
  title: string;
  count: number;
  items: string[];
  onMore: () => void;
}) {
  return (
    <Card className="p-4 glass-premium hover:shadow-md transition-shadow cursor-pointer" onClick={onMore}>
      <div className="flex justify-between text-sm font-bold mb-2">
        <span>{title}</span>
        <span className="font-mono text-gold2 text-xs">{count}</span>
      </div>
      {items.map((item, i) => (
        <div key={i} className="text-xs text-text2 truncate py-0.5">{item}</div>
      ))}
      {!items.length && <p className="text-text3 text-xs">—</p>}
    </Card>
  );
}
