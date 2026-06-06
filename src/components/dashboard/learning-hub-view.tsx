"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { YearPayload } from "@/types/lifeos";
import { uid } from "@/lib/utils";

interface LearningHubViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
}

export function LearningHubView({ yearData, onRefresh }: LearningHubViewProps) {
  const [sessionTopic, setSessionTopic] = useState("");
  const paths = yearData.learningPaths ?? [];
  const courses = yearData.learningCourses ?? [];
  const certs = yearData.learningCertifications ?? [];
  const sessions = yearData.studySessions ?? [];
  const areas = yearData.knowledgeAreas ?? [];

  const metrics = useMemo(() => {
    const mins = sessions.reduce((s, x) => s + x.durationMin, 0);
    return {
      totalHours: Math.round((mins / 60) * 10) / 10,
      coursesDone: courses.filter((c) => c.status === "done").length,
      certsDone: certs.filter((c) => c.status === "done").length,
      areaProgress: areas.length
        ? Math.round(areas.reduce((s, x) => s + Math.min(100, Math.round((x.progress / x.target) * 100)), 0) / areas.length)
        : 0,
    };
  }, [sessions, courses, certs, areas]);

  async function addStudySession() {
    if (!sessionTopic.trim()) return;
    const next = {
      id: uid(),
      topic: sessionTopic.trim(),
      date: new Date().toISOString().slice(0, 10),
      durationMin: 45,
      focus: 8,
    };
    await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSessionTopic("");
    onRefresh();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="🧠 Learning Hub"
        subtitle="مسارات تعلم وشهادات وجلسات دراسة مع تتبع تقدم تنفيذي"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-text3">ساعات الدراسة</div><div className="text-xl font-black text-gold2">{metrics.totalHours}h</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">دورات مكتملة</div><div className="text-xl font-black text-emerald">{metrics.coursesDone}</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">شهادات مكتملة</div><div className="text-xl font-black text-sky">{metrics.certsDone}</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">تقدم المعرفة</div><div className="text-xl font-black text-purple">{metrics.areaProgress}%</div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-2">
          <h3 className="font-bold text-gold2">Learning Paths</h3>
          {paths.map((p) => (
            <div key={p.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
              <span>{p.title}</span>
              <span className="font-mono text-text3">{p.progress}%</span>
            </div>
          ))}
        </Card>

        <Card className="p-4 space-y-2">
          <h3 className="font-bold text-gold2">Courses & Certifications</h3>
          {[...courses, ...certs.map((c) => ({ id: c.id, title: c.name, progress: c.status === "done" ? 100 : 50, status: c.status }))].slice(0, 8).map((c) => (
            <div key={c.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
              <span>{c.title}</span>
              <span className="text-text3">{c.progress}%</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="p-4 space-y-3">
        <h3 className="font-bold text-gold2">Study Sessions</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <div className="md:col-span-2">
            <Label>موضوع الجلسة</Label>
            <Input value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button variant="gold" onClick={addStudySession}>+ جلسة 45 دقيقة</Button>
          </div>
        </div>
        {sessions.map((s) => (
          <div key={s.id} className="text-sm border-b border-border/50 pb-2">
            {s.topic} · {s.date} · {s.durationMin} دقيقة
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="font-bold text-gold2">Knowledge Areas</h3>
        {(areas.length ? areas : [
          { id: "ka1", name: "Corporate Finance", progress: 45, target: 100 },
          { id: "ka2", name: "Data Storytelling", progress: 35, target: 100 },
          { id: "ka3", name: "Strategic Planning", progress: 20, target: 100 },
        ]).map((a) => (
          <div key={a.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
            <span>{a.name}</span>
            <span className="font-mono text-text3">{a.progress}/{a.target}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
