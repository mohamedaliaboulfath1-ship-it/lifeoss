"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FOCUS_SESSION_MINUTES } from "@/lib/time/defaults";
import type { FocusSessionType } from "@/types/time";

const PRESETS: { id: FocusSessionType; label: string }[] = [
  { id: "pomodoro_25", label: "25 د" },
  { id: "pomodoro_50", label: "50 د" },
  { id: "deep_90", label: "90 د" },
  { id: "deep_120", label: "120 د" },
];

interface Props {
  onComplete?: () => void;
  domainId?: string;
  goalId?: string;
  taskId?: string;
  timeBlockId?: string;
}

export function FocusTimer({ onComplete, domainId, goalId, taskId, timeBlockId }: Props) {
  const [preset, setPreset] = useState<FocusSessionType>("pomodoro_25");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SESSION_MINUTES.pomodoro_25 * 60);
  const [running, setRunning] = useState(false);
  const startedAt = useRef<string | null>(null);

  useEffect(() => {
    setSecondsLeft(FOCUS_SESSION_MINUTES[preset] * 60);
    setRunning(false);
  }, [preset]);

  const finishSession = useCallback(
    async (interrupted: boolean) => {
      setRunning(false);
      const duration = FOCUS_SESSION_MINUTES[preset];
      const now = new Date().toISOString();
      await fetch("/api/time/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startedAt: startedAt.current ?? now,
          endedAt: now,
          durationMinutes: interrupted ? Math.max(1, Math.round((FOCUS_SESSION_MINUTES[preset] * 60 - secondsLeft) / 60)) : duration,
          sessionType: preset,
          domainId,
          goalId,
          taskId,
          timeBlockId,
          interrupted,
          focusScore: interrupted ? 40 : 85,
        }),
      });
      onComplete?.();
      setSecondsLeft(FOCUS_SESSION_MINUTES[preset] * 60);
      startedAt.current = null;
    },
    [preset, secondsLeft, domainId, goalId, taskId, timeBlockId, onComplete]
  );

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (running && secondsLeft === 0) void finishSession(false);
  }, [running, secondsLeft, finishSession]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <Card className="p-4 space-y-3">
      <div className="text-sm font-bold">🍅 Deep Work</div>
      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className={`text-xs px-2 py-1 rounded-sm border ${preset === p.id ? "border-gold text-gold2" : "border-border text-text3"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="text-4xl font-mono font-black text-center text-gold2">
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </div>
      <div className="flex gap-2 justify-center">
        {!running ? (
          <Button
            variant="gold"
            onClick={() => {
              startedAt.current = new Date().toISOString();
              setRunning(true);
            }}
          >
            ابدأ
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={() => void finishSession(true)}>إيقاف</Button>
            <Button variant="gold" onClick={() => void finishSession(false)}>إنهاء</Button>
          </>
        )}
      </div>
    </Card>
  );
}
