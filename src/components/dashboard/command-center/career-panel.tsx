"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { DashboardCareerSummary } from "@/types/lifeos-pro";
import Link from "next/link";

export function CareerPanel({ career }: { career: DashboardCareerSummary }) {
  const skills = career.skills.slice(0, 4);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>📈 المهنة والتعلم</CardTitle>
        <Link href="/career" className="text-[11px] text-gold2 hover:underline">
          فتح المركز
        </Link>
      </CardHeader>
      <CardBody className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-text3">
              {career.currentRole ?? "—"} → <strong className="text-text">{career.targetRole ?? "حدّد هدفك"}</strong>
            </span>
            <span className="font-mono text-gold2">{career.transformationProgress}%</span>
          </div>
          <ProgressBar value={career.transformationProgress} color="var(--sky)" />
          {career.primaryGoalTitle && (
            <p className="text-[11px] text-text3 mt-1 truncate">{career.primaryGoalTitle}</p>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat
            label="ساعات التعلم"
            value={`${career.learningHoursWeek}/${career.learningHoursTarget}س`}
            icon="📚"
          />
          <MiniStat
            label="المهارات"
            value={String(skills.length)}
            icon="🧠"
          />
          <MiniStat
            label="الشهادات"
            value={String(career.certifications.length || "—")}
            icon="🎓"
          />
          <MiniStat
            label="الحالة"
            value={
              career.certifications.find((c) => c.status === "studying")?.name?.slice(0, 12) ??
              "تخطيط"
            }
            icon="📋"
          />
        </div>

        {!skills.length && (
          <p className="text-[11px] text-text3 text-center py-2">أضف مهاراتك من Career OS</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {skills.map((s) => (
            <div key={s.id} className="bg-surface2/60 rounded-sm p-2.5">
              <div className="text-[11px] font-medium truncate mb-1">{s.name}</div>
              <div className="flex items-center gap-2">
                <ProgressBar
                  value={Math.round((s.level / s.target) * 100)}
                  color="var(--purple)"
                  className="flex-1"
                />
                <span className="text-[10px] font-mono text-text3">
                  {s.level}/{s.target}
                </span>
              </div>
            </div>
          ))}
        </div>

        {career.certifications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {career.certifications.map((c) => (
              <span
                key={c.id}
                className="text-[10px] px-2 py-1 rounded-full bg-sky/10 border border-sky/20 text-sky"
              >
                {c.name} · {c.status}
              </span>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-surface2/50 rounded-sm p-2.5 text-center">
      <div className="text-lg">{icon}</div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-text3">{label}</div>
    </div>
  );
}
