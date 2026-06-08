"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/ui/virtual-list";
import { CareerRoadmapDnd } from "@/components/career/career-roadmap-dnd";
import { CareerJobsPanel } from "@/components/career/career-jobs-panel";
import { CareerIntegrationsPanel } from "@/components/career/career-integrations-panel";
import { uid } from "@/lib/utils";
import type { CareerReadiness } from "@/lib/career/readiness";
import type { CareerIntegrations } from "@/lib/career/integration";
import type {
  CareerCertification,
  CareerProfile,
  CareerRoadmapStage,
  CareerSkillMatrixItem,
  InterviewEntry,
  JobApplication,
  PortfolioProject,
  YearPayload,
} from "@/types/lifeos";
import type { DashboardInsight } from "@/types/lifeos-pro";

interface Props {
  yearData: YearPayload;
  onRefresh?: () => void;
}

const TABS = [
  { id: "overview", label: "🏠 نظرة عامة" },
  { id: "roadmap", label: "🧭 المسار" },
  { id: "skills", label: "🧩 المهارات" },
  { id: "certs", label: "🏅 الشهادات" },
  { id: "portfolio", label: "💼 المشاريع" },
  { id: "links", label: "🔗 الربط" },
  { id: "coach", label: "🧠 المدرب" },
  { id: "jobs", label: "📋 الطلبات" },
];

type CareerBundle = {
  profile: CareerProfile | null;
  roadmap: CareerRoadmapStage[];
  skills: CareerSkillMatrixItem[];
  certifications: CareerCertification[];
  portfolio: PortfolioProject[];
  jobApplications: JobApplication[];
  interviews: InterviewEntry[];
  readiness: CareerReadiness;
  insights: DashboardInsight[];
  integrations?: CareerIntegrations;
  unifiedScore?: number;
};

export function CareerOsView({ yearData, onRefresh }: Props) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<CareerBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"node" | "skill" | "cert" | "project" | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/career");
    const json = await res.json().catch(() => null);
    if (json?.roadmap) {
      setData(json as CareerBundle);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const subtitle = useMemo(() => {
    if (!data?.roadmap.length) return "ابنِ مسارك المهني من الصفر — لا مسارات افتراضية";
    return data.roadmap.map((s) => s.title).join(" → ");
  }, [data?.roadmap]);

  async function post(entity: string, payload: Record<string, unknown>) {
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, payload }),
    });
    setModal(null);
    setForm({});
    await load();
    onRefresh?.();
  }

  async function remove(entity: string, id: string) {
    await fetch("/api/career", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, id }),
    });
    await load();
    onRefresh?.();
  }

  async function reorderRoadmap(order: string[]) {
    await fetch("/api/career", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder_milestones", order }),
    });
    await load();
    onRefresh?.();
  }

  async function patchSkill(id: string, current: number) {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        skills: prev.skills.map((s) =>
          s.id === id ? { ...s, current, manualScore: current } : s
        ),
      };
    });
    await fetch("/api/career", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "skill", id, payload: { current, manualScore: current } }),
    });
  }

  if (loading && !data) {
    return <div className="h-48 skeleton-shimmer rounded-[10px]" />;
  }

  const d = data ?? {
    profile: yearData.careerProfile ?? null,
    roadmap: yearData.careerRoadmap ?? [],
    skills: yearData.careerSkillMatrix ?? [],
    certifications: yearData.careerCertifications ?? [],
    portfolio: yearData.careerPortfolio ?? [],
    jobApplications: yearData.jobApplications ?? [],
    interviews: yearData.interviews ?? [],
    readiness: { score: 0, targetScore: 100, gap: 100, forecastYears: null, breakdown: { skills: 0, certifications: 0, projects: 0, learning: 0, roadmap: 0 } },
    insights: [],
  };

  const readiness = d.readiness;
  const score = d.unifiedScore ?? readiness.score;

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader title="📈 Career OS" subtitle={subtitle} />

      <Card className="p-5 border-gold/30 bg-gradient-to-br from-gold/[0.06] to-transparent">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <ReadinessStat label="جاهزية مهنية" value={`${score}%`} accent="text-gold2" />
          <ReadinessStat label="الهدف" value={`${readiness.targetScore}%`} accent="text-emerald2" />
          <ReadinessStat label="الفجوة" value={`${readiness.gap}%`} accent="text-sky2" />
          <ReadinessStat
            label="التوقع"
            value={readiness.forecastYears != null ? `${readiness.forecastYears} سنة` : "—"}
            accent="text-purple2"
          />
          <ReadinessStat label="مهارات" value={`${d.skills.length}`} accent="text-amber2" />
        </div>
        <ProgressBar value={score} color="var(--gold)" className="h-2 mt-4" />
        <div className="grid grid-cols-5 gap-2 mt-3 text-[10px] text-text3 text-center">
          <span>مهارات {readiness.breakdown.skills}%</span>
          <span>شهادات {readiness.breakdown.certifications}%</span>
          <span>مشاريع {readiness.breakdown.projects}%</span>
          <span>تعلم {readiness.breakdown.learning}%</span>
          <span>مسار {readiness.breakdown.roadmap}%</span>
        </div>
      </Card>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="grid md:grid-cols-2 gap-4">
          {d.insights.map((i) => (
            <Card key={i.id} className="p-4 text-sm border-border2">
              <div className="font-medium">{i.icon} {i.message}</div>
              <div className="text-xs text-gold2 mt-1">{i.action}</div>
            </Card>
          ))}
          {!d.insights.length && (
            <EmptyState title="ابدأ ببناء مسارك" description="أضف مرحلة مهنية أو مهارة لتفعيل المدرب" />
          )}
        </div>
      )}

      {tab === "roadmap" && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm font-bold">Career Path Builder — اسحب لإعادة الترتيب</div>
            <Button variant="gold" size="sm" onClick={() => setModal("node")}>+ مرحلة جديدة</Button>
          </div>
          {!d.roadmap.length ? (
            <EmptyState title="لا مسار بعد" description="أنشئ مسارك: Accountant → FA → CFO أو أي مسار تريده" />
          ) : (
            <CareerRoadmapDnd stages={d.roadmap} onReorder={reorderRoadmap} onDelete={(id) => remove("milestone", id)} />
          )}
        </Card>
      )}

      {tab === "skills" && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between">
            <div className="text-sm font-bold">Skills Matrix 2.0 (0–100)</div>
            <Button variant="gold" size="sm" onClick={() => setModal("skill")}>+ مهارة</Button>
          </div>
          {!d.skills.length && <EmptyState title="لا مهارات" description="أضف Excel، Financial Modeling، Power BI..." />}
          <VirtualList
            items={d.skills}
            rowHeight={88}
            maxHeight={480}
            renderRow={(s) => (
              <div className="space-y-1 pb-3">
                <div className="flex justify-between text-sm">
                  <span>{s.name} <span className="text-[10px] text-text3">({s.scoringMode ?? "hybrid"})</span></span>
                  <span className="font-mono">{s.current}% / {s.target}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.manualScore ?? s.current}
                  className="w-full accent-[var(--gold)]"
                  onChange={(e) => void patchSkill(s.id, parseInt(e.target.value, 10))}
                />
                <div className="flex justify-between text-[10px] text-text3">
                  <span>يدوي: {s.manualScore ?? s.current}%</span>
                  <span>دليل: {s.evidenceScore ?? 0}%</span>
                  <button type="button" className="text-red2" onClick={() => remove("skill", s.id)}>حذف</button>
                </div>
              </div>
            )}
          />
        </Card>
      )}

      {tab === "certs" && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between">
            <div className="text-sm font-bold">الشهادات — Timeline</div>
            <Button variant="gold" size="sm" onClick={() => setModal("cert")}>+ شهادة</Button>
          </div>
          {!d.certifications.length && <EmptyState title="لا شهادات" description="CMA، CFA، FMVA، Power BI..." />}
          <VirtualList
            items={[...d.certifications].sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))}
            rowHeight={56}
            maxHeight={400}
            renderRow={(c) => (
              <div className="flex justify-between items-center border-b border-border/50 pb-2">
                <div>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-text3">{c.provider} · {c.dueDate ?? "بدون تاريخ"} · تأثير {c.careerImpactScore ?? 50}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-gold2">{c.progressPct ?? 0}%</span>
                  <span className="text-xs text-text3">{c.status}</span>
                  <button type="button" className="text-xs text-red2" onClick={() => remove("certification", c.id)}>حذف</button>
                </div>
              </div>
            )}
          />
        </Card>
      )}

      {tab === "portfolio" && (
        <Card className="p-4 space-y-4">
          <div className="flex justify-between">
            <div className="text-sm font-bold">Portfolio Projects</div>
            <Button variant="gold" size="sm" onClick={() => setModal("project")}>+ مشروع</Button>
          </div>
          {!d.portfolio.length && <EmptyState title="لا مشاريع" description="أضف مشاريعك لرفع مستوى المهارات تلقائياً" />}
          {d.portfolio.map((p) => (
            <div key={p.id} className="border border-border rounded-sm p-3">
              <div className="flex justify-between">
                <div className="font-bold text-sm">{p.title}</div>
                <button type="button" className="text-xs text-red2" onClick={() => remove("portfolio", p.id)}>حذف</button>
              </div>
              <div className="text-xs text-text3 mt-1">{p.description ?? "—"}</div>
              <div className="text-xs mt-1">مهارات: {p.skillsUsed.join(", ") || "—"}</div>
              <div className="text-xs text-gold2">تأثير مهني: {p.careerImpact ?? 0}% · {p.status}</div>
            </div>
          ))}
        </Card>
      )}

      {tab === "links" && d.integrations && <CareerIntegrationsPanel integrations={d.integrations} />}
      {tab === "links" && !d.integrations && (
        <EmptyState title="الربط" description="أضف أهدافاً وعادات وكتباً مهنية" />
      )}

      {tab === "coach" && (
        <Card className="p-4 space-y-3">
          <div className="text-sm font-bold">AI Career Coach</div>
          {d.insights.map((i) => (
            <div key={i.id} className="p-3 rounded-sm border border-border2 bg-surface2 text-sm">
              {i.icon} {i.message}
              <div className="text-xs text-text3 mt-1">{i.action}</div>
            </div>
          ))}
          {!d.insights.length && <p className="text-text3 text-sm">أضف مساراً ومهارات لتفعيل المدرب</p>}
        </Card>
      )}

      {tab === "jobs" && (
        <CareerJobsPanel
          jobs={d.jobApplications}
          interviews={d.interviews}
          onRefresh={load}
        />
      )}

      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-gold2">
              {modal === "node" && "مرحلة مهنية جديدة"}
              {modal === "skill" && "مهارة جديدة"}
              {modal === "cert" && "شهادة جديدة"}
              {modal === "project" && "مشروع جديد"}
            </h3>
            {modal === "node" && (
              <>
                <Field label="المسمى الوظيفي" keyName="title" form={form} setForm={setForm} placeholder="Financial Analyst" />
                <Field label="تاريخ الهدف" keyName="targetDate" form={form} setForm={setForm} type="date" />
                <Field label="نطاق الراتب" keyName="salaryRange" form={form} setForm={setForm} placeholder="15k–20k SAR" />
                <Field label="التركيز (مفصول بفاصلة)" keyName="focus" form={form} setForm={setForm} placeholder="Modeling, BI" />
              </>
            )}
            {modal === "skill" && (
              <>
                <Field label="اسم المهارة" keyName="name" form={form} setForm={setForm} placeholder="Financial Modeling" />
                <Field label="المستوى الحالي %" keyName="current" form={form} setForm={setForm} type="number" />
                <Field label="الهدف %" keyName="target" form={form} setForm={setForm} type="number" placeholder="90" />
              </>
            )}
            {modal === "cert" && (
              <>
                <Field label="الشهادة" keyName="name" form={form} setForm={setForm} placeholder="FMVA" />
                <Field label="المزود" keyName="provider" form={form} setForm={setForm} placeholder="CFI" />
                <Field label="تاريخ الهدف" keyName="dueDate" form={form} setForm={setForm} type="date" />
                <Field label="تأثير مهني %" keyName="careerImpactScore" form={form} setForm={setForm} type="number" placeholder="50" />
              </>
            )}
            {modal === "project" && (
              <>
                <Field label="عنوان المشروع" keyName="title" form={form} setForm={setForm} />
                <Field label="الوصف" keyName="description" form={form} setForm={setForm} />
                <Field label="المهارات (فاصلة)" keyName="skillsUsed" form={form} setForm={setForm} placeholder="Excel, Modeling" />
                <Field label="تأثير مهني %" keyName="careerImpact" form={form} setForm={setForm} type="number" />
              </>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setModal(null)}>إلغاء</Button>
              <Button
                variant="gold"
                onClick={() => {
                  if (modal === "node") {
                    void post("milestone", {
                      id: uid(),
                      title: form.title,
                      targetDate: form.targetDate,
                      salaryRange: form.salaryRange,
                      focus: form.focus?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
                      stageOrder: d.roadmap.length + 1,
                      status: d.roadmap.length === 0 ? "active" : "planned",
                    });
                  } else if (modal === "skill") {
                    void post("skill", {
                      id: uid(),
                      name: form.name,
                      current: parseInt(form.current || "0", 10),
                      target: parseInt(form.target || "80", 10),
                      scoringMode: "hybrid",
                    });
                  } else if (modal === "cert") {
                    void post("certification", {
                      id: uid(),
                      name: form.name,
                      provider: form.provider,
                      dueDate: form.dueDate,
                      careerImpactScore: parseInt(form.careerImpactScore || "50", 10),
                      status: "planned",
                    });
                  } else if (modal === "project") {
                    void post("portfolio", {
                      id: uid(),
                      title: form.title,
                      description: form.description,
                      skillsUsed: form.skillsUsed?.split(",").map((s) => s.trim()).filter(Boolean) ?? [],
                      careerImpact: parseInt(form.careerImpact || "10", 10),
                      status: "active",
                    });
                  }
                }}
              >
                حفظ
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function ReadinessStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="p-2 rounded-sm bg-surface2/80 border border-border/50">
      <div className="text-[10px] text-text3">{label}</div>
      <div className={`text-lg font-black ${accent}`}>{value}</div>
    </div>
  );
}

function Field({
  label,
  keyName,
  form,
  setForm,
  type = "text",
  placeholder,
}: {
  label: string;
  keyName: string;
  form: Record<string, string>;
  setForm: (f: Record<string, string>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type={type}
        dir={type === "date" ? "ltr" : undefined}
        placeholder={placeholder}
        value={form[keyName] ?? ""}
        onChange={(e) => setForm({ ...form, [keyName]: e.target.value })}
      />
    </div>
  );
}
