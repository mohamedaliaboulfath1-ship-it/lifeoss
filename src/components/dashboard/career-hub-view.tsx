"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { YearPayload, JobApplication, InterviewEntry, MentorEntry, NetworkContact } from "@/types/lifeos";
import { uid } from "@/lib/utils";

interface CareerHubViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
}

const TABS = [
  { id: "roadmap", label: "🧭 Roadmap" },
  { id: "skills", label: "🧩 Skill Matrix" },
  { id: "certs", label: "🏅 Certifications" },
  { id: "courses", label: "🎓 Courses" },
  { id: "jobs", label: "💼 Applications" },
  { id: "interviews", label: "🗣 Interviews" },
  { id: "mentors", label: "🤝 Mentors" },
  { id: "network", label: "🌐 Networking CRM" },
];

export function CareerHubView({ yearData, onRefresh }: CareerHubViewProps) {
  const [tab, setTab] = useState("roadmap");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const roadmap = yearData.careerRoadmap ?? [];
  const skills = yearData.careerSkillMatrix ?? [];
  const certs = yearData.careerCertifications ?? [];
  const courses = yearData.careerCourses ?? [];
  const jobs = yearData.jobApplications ?? [];
  const interviews = yearData.interviews ?? [];
  const mentors = yearData.mentors ?? [];
  const contacts = yearData.networkContacts ?? [];

  const analytics = useMemo(() => {
    const avgGap = skills.length
      ? Math.round(
          skills.reduce((s, x) => s + Math.max(0, x.target - x.current), 0) / skills.length
        )
      : 0;
    const certificationsDone = certs.filter((x) => x.status === "done").length;
    const activeApplications = jobs.filter((x) => ["applied", "screening", "interview"].includes(x.status)).length;
    return { avgGap, certificationsDone, activeApplications };
  }, [skills, certs, jobs]);

  async function addJob() {
    if (!company.trim() || !role.trim()) return;
    const next: JobApplication = {
      id: uid(),
      company: company.trim(),
      role: role.trim(),
      status: "applied",
      appliedAt: new Date().toISOString().slice(0, 10),
    };
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "job_application", payload: next }),
    });
    setCompany("");
    setRole("");
    onRefresh();
  }

  async function addInterview() {
    const next: InterviewEntry = {
      id: uid(),
      company: company.trim() || "شركة",
      stage: "Technical",
      date: new Date().toISOString().slice(0, 10),
      result: "pending",
    };
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "interview", payload: next }),
    });
    onRefresh();
  }

  async function addMentor() {
    const next: MentorEntry = {
      id: uid(),
      name: "Mentor جديد",
      area: "Finance Leadership",
      cadence: "شهري",
      lastTouch: new Date().toISOString().slice(0, 10),
    };
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "mentor", payload: next }),
    });
    onRefresh();
  }

  async function addContact() {
    const next: NetworkContact = {
      id: uid(),
      name: "Contact جديد",
      company: "Unknown",
      role: "Finance",
      channel: "linkedin",
      lastContact: new Date().toISOString().slice(0, 10),
    };
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "network_contact", payload: next }),
    });
    onRefresh();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="📈 Career Hub"
        subtitle="خارطة التحول المهني: محاسب → FA → Senior FA → Finance Manager → CFO"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-text3">متوسط فجوة المهارات</div><div className="text-xl font-black text-gold2">{analytics.avgGap}%</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">الشهادات المكتملة</div><div className="text-xl font-black text-emerald">{analytics.certificationsDone}</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">طلبات نشطة</div><div className="text-xl font-black text-sky">{analytics.activeApplications}</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">إجمالي العلاقات</div><div className="text-xl font-black text-purple">{contacts.length}</div></Card>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "roadmap" && (
        <Card className="p-4 space-y-3">
          {roadmap.map((stage) => (
            <div key={stage.id} className="border border-border rounded-sm p-3 bg-surface2/40">
              <div className="font-bold">{stage.title}</div>
              <div className="text-xs text-text3">{stage.from ?? "—"} → {stage.to ?? "مستمر"}</div>
              <div className="text-xs mt-2">{stage.focus.join(" · ")}</div>
            </div>
          ))}
        </Card>
      )}

      {tab === "skills" && (
        <Card className="p-4 space-y-3">
          {skills.map((s) => (
            <div key={s.id}>
              <div className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-mono">{s.current}% / {s.target}%</span>
              </div>
              <div className="h-2 bg-border rounded-sm mt-1 overflow-hidden">
                <div className="h-full bg-gold" style={{ width: `${Math.min(100, Math.round((s.current / s.target) * 100))}%` }} />
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab === "certs" && (
        <Card className="p-4 space-y-2">
          {certs.map((c) => (
            <div key={c.id} className="flex justify-between border-b border-border/60 pb-2">
              <span>{c.name}</span>
              <span className="text-xs text-text3">{c.provider} · {c.status}</span>
            </div>
          ))}
        </Card>
      )}

      {tab === "courses" && (
        <Card className="p-4 space-y-2">
          {courses.map((c) => (
            <div key={c.id} className="flex justify-between border-b border-border/60 pb-2">
              <span>{c.title}</span>
              <span className="text-xs text-text3">{c.progress}% · {c.hours}h</span>
            </div>
          ))}
        </Card>
      )}

      {tab === "jobs" && (
        <Card className="p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-2">
            <div><Label>الشركة</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
            <div><Label>الدور</Label><Input value={role} onChange={(e) => setRole(e.target.value)} /></div>
            <div className="flex items-end"><Button variant="gold" onClick={addJob}>+ إضافة طلب</Button></div>
          </div>
          {jobs.map((j) => (
            <div key={j.id} className="text-sm border-b border-border/50 pb-2">{j.company} · {j.role} · <span className="text-text3">{j.status}</span></div>
          ))}
        </Card>
      )}

      {tab === "interviews" && (
        <Card className="p-4 space-y-3">
          <Button variant="ghost" onClick={addInterview}>+ إضافة مقابلة</Button>
          {interviews.map((i) => (
            <div key={i.id} className="text-sm border-b border-border/50 pb-2">{i.company} · {i.stage} · {i.date}</div>
          ))}
        </Card>
      )}

      {tab === "mentors" && (
        <Card className="p-4 space-y-3">
          <Button variant="ghost" onClick={addMentor}>+ إضافة مرشد</Button>
          {mentors.map((m) => (
            <div key={m.id} className="text-sm border-b border-border/50 pb-2">{m.name} · {m.area} · {m.cadence}</div>
          ))}
        </Card>
      )}

      {tab === "network" && (
        <Card className="p-4 space-y-3">
          <Button variant="ghost" onClick={addContact}>+ إضافة جهة اتصال</Button>
          {contacts.map((c) => (
            <div key={c.id} className="text-sm border-b border-border/50 pb-2">{c.name} · {c.company ?? "—"} · {c.channel}</div>
          ))}
        </Card>
      )}
    </div>
  );
}
