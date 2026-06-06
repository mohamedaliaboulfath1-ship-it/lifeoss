"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageTransition } from "@/components/motion/motion";

interface Stats {
  totalUsers: number;
  activeUsers7d: number;
  newRegistrations7d: number;
  totalBooks: number;
  totalNotifications: number;
  systemHealth: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin?action=stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <p className="text-text3 text-sm">جاري التحميل...</p>;

  return (
    <PageTransition>
      <h1 className="text-lg font-bold text-gold2 mb-6">لوحة المسؤول</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard label="إجمالي المستخدمين" value={String(stats.totalUsers)} sub="" color="var(--gold)" />
        <KpiCard label="نشط (7 أيام)" value={String(stats.activeUsers7d)} sub="" color="var(--emerald)" />
        <KpiCard label="تسجيلات جديدة" value={String(stats.newRegistrations7d)} sub="7 أيام" color="var(--sky)" />
        <KpiCard label="الكتب" value={String(stats.totalBooks)} sub="" color="var(--purple)" />
        <KpiCard label="الإشعارات" value={String(stats.totalNotifications)} sub="" color="var(--coral)" />
        <KpiCard label="صحة النظام" value={stats.systemHealth} sub="" color="var(--teal)" />
      </div>
      <Card className="p-4 text-sm text-text3">
        لتعيين مسؤول: في Supabase SQL Editor نفّذ{" "}
        <code dir="ltr" className="text-gold2">
          update profiles set role=&apos;admin&apos; where id=&apos;YOUR_USER_ID&apos;;
        </code>
      </Card>
    </PageTransition>
  );
}
