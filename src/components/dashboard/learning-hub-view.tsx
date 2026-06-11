"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import type { YearPayload } from "@/types/lifeos";

interface LearningHubViewProps {
  yearData: YearPayload;
  onRefresh: () => void;
}

type LearningPath = { id: string; title: string; progress: number; targetDate?: string };
type KnowledgeArea = { id: string; name: string; progress: number; target: number };
type StudySession = { id: string; topic: string; date: string; durationMin: number; focus: number };

export function LearningHubView({ yearData, onRefresh }: LearningHubViewProps) {
  const [sessionTopic, setSessionTopic] = useState("");
  const [paths, setPaths] = useState<LearningPath[]>(yearData.learningPaths ?? []);
  const [areas, setAreas] = useState<KnowledgeArea[]>(yearData.knowledgeAreas ?? []);
  const [sessions, setSessions] = useState<StudySession[]>(yearData.studySessions ?? []);
  const [pathForm, setPathForm] = useState({ title: "", progress: "0" });
  const [areaForm, setAreaForm] = useState({ name: "", progress: "0", target: "100" });

  const courses = yearData.learningCourses ?? [];
  const certs = yearData.learningCertifications ?? [];

  const loadData = useCallback(async () => {
    const res = await fetch("/api/learning");
    const json = await res.json().catch(() => ({}));
    if (json.paths) setPaths(json.paths);
    if (json.knowledgeAreas) setAreas(json.knowledgeAreas);
    if (json.sessions) setSessions(json.sessions);
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

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
    await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "session", payload: { topic: sessionTopic.trim(), durationMin: 45, focus: 8 } }),
    });
    setSessionTopic("");
    await loadData();
    onRefresh();
  }

  async function addPath() {
    if (!pathForm.title.trim()) return;
    await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "path",
        payload: { title: pathForm.title, progress: parseInt(pathForm.progress, 10) || 0 },
      }),
    });
    setPathForm({ title: "", progress: "0" });
    await loadData();
    onRefresh();
  }

  async function addArea() {
    if (!areaForm.name.trim()) return;
    await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "knowledge_area",
        payload: {
          name: areaForm.name,
          progress: parseInt(areaForm.progress, 10) || 0,
          target: parseInt(areaForm.target, 10) || 100,
        },
      }),
    });
    setAreaForm({ name: "", progress: "0", target: "100" });
    await loadData();
    onRefresh();
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader
        title="🧠 Learning Hub"
        subtitle="مسارات تعلم وشهادات وجلسات دراسة — نظام تعلم متكامل"
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-text3">ساعات الدراسة</div><div className="text-xl font-black text-gold2">{metrics.totalHours}h</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">دورات مكتملة</div><div className="text-xl font-black text-emerald">{metrics.coursesDone}</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">شهادات مكتملة</div><div className="text-xl font-black text-sky">{metrics.certsDone}</div></Card>
        <Card className="p-4"><div className="text-xs text-text3">تقدم المعرفة</div><div className="text-xl font-black text-purple">{metrics.areaProgress}%</div></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h3 className="font-bold text-gold2">Learning Paths</h3>
          {paths.length === 0 ? (
            <EmptyState icon="🛤️" title="لا مسارات بعد" description="أنشئ أول مسار تعلم" />
          ) : paths.map((p) => (
            <div key={p.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
              <span>{p.title}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-text3">{p.progress}%</span>
                <button
                  type="button"
                  className="text-rose2 text-xs"
                  onClick={async () => {
                    await fetch(`/api/learning?entity=path&id=${p.id}`, { method: "DELETE" });
                    await loadData();
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <Input placeholder="مسار جديد..." value={pathForm.title} onChange={(e) => setPathForm({ ...pathForm, title: e.target.value })} />
            <Button variant="gold" size="sm" onClick={addPath}>+</Button>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-bold text-gold2">Courses & Certifications</h3>
          {[...courses, ...certs.map((c) => ({ id: c.id, title: c.name, progress: c.status === "done" ? 100 : 50, status: c.status }))].slice(0, 8).map((c) => (
            <div key={c.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
              <span>{c.title}</span>
              <span className="text-text3">{c.progress}%</span>
            </div>
          ))}
          {!courses.length && !certs.length && (
            <div className="text-xs text-text3">أضف دورات من Career Hub أو Learning</div>
          )}
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
          <div key={s.id} className="flex justify-between text-sm border-b border-border/50 pb-2">
            <span>{s.topic} · {s.date} · {s.durationMin} دقيقة</span>
            <button
              type="button"
              className="text-rose2 text-xs"
              onClick={async () => {
                await fetch(`/api/learning?entity=session&id=${s.id}`, { method: "DELETE" });
                await loadData();
              }}
            >
              حذف
            </button>
          </div>
        ))}
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-bold text-gold2">Knowledge Areas</h3>
        {areas.map((a) => (
          <div key={a.id} className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
            <span>{a.name}</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-text3">{a.progress}/{a.target}</span>
              <button
                type="button"
                className="text-rose2 text-xs"
                onClick={async () => {
                  await fetch(`/api/learning?entity=knowledge_area&id=${a.id}`, { method: "DELETE" });
                  await loadData();
                }}
              >
                حذف
              </button>
            </div>
          </div>
        ))}
        <div className="grid md:grid-cols-4 gap-2 pt-2">
          <div className="md:col-span-2"><Input placeholder="مجال معرفي..." value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} /></div>
          <Input placeholder="تقدم" value={areaForm.progress} onChange={(e) => setAreaForm({ ...areaForm, progress: e.target.value })} />
          <Button variant="gold" size="sm" onClick={addArea}>+ مجال</Button>
        </div>
      </Card>
    </div>
  );
}
