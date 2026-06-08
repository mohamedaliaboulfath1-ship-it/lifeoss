"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { VirtualList } from "@/components/ui/virtual-list";
import { uid } from "@/lib/utils";
import type { InterviewEntry, JobApplication } from "@/types/lifeos";

const PIPELINE: { id: JobApplication["status"]; label: string; color: string }[] = [
  { id: "wishlist", label: "قائمة الرغبات", color: "var(--text3)" },
  { id: "applied", label: "مُقدَّم", color: "var(--sky)" },
  { id: "screening", label: "فرز", color: "var(--amber2)" },
  { id: "interview", label: "مقابلة", color: "var(--gold)" },
  { id: "offer", label: "عرض", color: "var(--emerald)" },
  { id: "rejected", label: "مرفوض", color: "var(--coral)" },
  { id: "accepted", label: "مقبول", color: "var(--purple)" },
];

interface Props {
  jobs: JobApplication[];
  interviews: InterviewEntry[];
  onRefresh: () => void;
}

export function CareerJobsPanel({ jobs, interviews, onRefresh }: Props) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [view, setView] = useState<"pipeline" | "interviews">("pipeline");

  async function addJob() {
    if (!company.trim() || !role.trim()) return;
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "job_application",
        payload: {
          id: uid(),
          company: company.trim(),
          role: role.trim(),
          status: "applied",
          appliedAt: new Date().toISOString().slice(0, 10),
        },
      }),
    });
    setCompany("");
    setRole("");
    onRefresh();
  }

  async function updateStatus(id: string, status: JobApplication["status"]) {
    await fetch("/api/career", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "job_application", id, payload: { status } }),
    });
    onRefresh();
  }

  async function addInterview() {
    await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "interview",
        payload: {
          id: uid(),
          company: company.trim() || "شركة",
          stage: "Technical",
          date: new Date().toISOString().slice(0, 10),
          result: "pending",
        },
      }),
    });
    onRefresh();
  }

  async function removeJob(id: string) {
    await fetch("/api/career", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "job_application", id }),
    });
    onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={view === "pipeline" ? "gold" : "ghost"} size="sm" onClick={() => setView("pipeline")}>
          Pipeline
        </Button>
        <Button variant={view === "interviews" ? "gold" : "ghost"} size="sm" onClick={() => setView("interviews")}>
          مقابلات ({interviews.length})
        </Button>
      </div>

      <Card className="p-4 space-y-3">
        <div className="grid md:grid-cols-3 gap-2">
          <div><Label>الشركة</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
          <div><Label>الدور</Label><Input value={role} onChange={(e) => setRole(e.target.value)} /></div>
          <div className="flex items-end gap-2">
            <Button variant="gold" onClick={addJob}>+ طلب</Button>
            <Button variant="ghost" onClick={addInterview}>+ مقابلة</Button>
          </div>
        </div>
      </Card>

      {view === "pipeline" && (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 overflow-x-auto pb-2">
          {PIPELINE.map((col) => {
            const colJobs = jobs.filter((j) => j.status === col.id);
            return (
              <div key={col.id} className="min-w-[120px] bg-surface2/40 rounded-sm p-2 border border-border/50">
                <div className="text-[10px] font-bold mb-2" style={{ color: col.color }}>
                  {col.label} ({colJobs.length})
                </div>
                <VirtualList
                  items={colJobs}
                  rowHeight={72}
                  maxHeight={320}
                  renderRow={(j) => (
                    <div className="p-2 mb-1 bg-surface rounded-sm border border-border/40 text-xs">
                      <div className="font-medium truncate">{j.company}</div>
                      <div className="text-text3 truncate">{j.role}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {PIPELINE.filter((p) => p.id !== j.status).slice(0, 2).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="text-[9px] px-1 rounded bg-border/50 hover:bg-gold/20"
                            onClick={() => updateStatus(j.id, p.id)}
                          >
                            →{p.label.slice(0, 4)}
                          </button>
                        ))}
                        <button type="button" className="text-[9px] text-red2 ml-auto" onClick={() => removeJob(j.id)}>✕</button>
                      </div>
                    </div>
                  )}
                />
              </div>
            );
          })}
        </div>
      )}

      {view === "interviews" && (
        <Card className="p-4">
          <VirtualList
            items={interviews}
            rowHeight={48}
            maxHeight={400}
            renderRow={(i) => (
              <div className="flex justify-between border-b border-border/50 py-2 text-sm">
                <span>{i.company} · {i.stage}</span>
                <span className="text-text3 font-mono text-xs">{i.date} · {i.result}</span>
              </div>
            )}
          />
          {!interviews.length && <p className="text-text3 text-sm text-center py-4">لا مقابلات مسجلة</p>}
        </Card>
      )}
    </div>
  );
}
