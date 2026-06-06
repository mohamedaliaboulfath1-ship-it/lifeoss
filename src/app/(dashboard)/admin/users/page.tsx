"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/motion/motion";

interface UserRow {
  id: string;
  display_name: string;
  role: string;
  suspended: boolean;
  created_at: string;
  last_active_at: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");

  async function load(search = "") {
    const res = await fetch(`/api/admin?action=users&q=${encodeURIComponent(search)}`);
    const json = await res.json();
    setUsers(json.users ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleSuspend(userId: string, suspended: boolean) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, suspended: !suspended }),
    });
    load(q);
  }

  return (
    <PageTransition>
      <h1 className="text-lg font-bold text-gold2 mb-4">إدارة المستخدمين</h1>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="بحث بالاسم..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="ghost" onClick={() => load(q)}>
          بحث
        </Button>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text3 text-xs">
              <th className="text-right p-3">الاسم</th>
              <th className="p-3">الدور</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">تاريخ الإنشاء</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border/50">
                <td className="p-3 font-medium">{u.display_name}</td>
                <td className="p-3 text-center font-mono text-xs">{u.role}</td>
                <td className="p-3 text-center">
                  {u.suspended ? (
                    <span className="text-rose2">معلّق</span>
                  ) : (
                    <span className="text-emerald2">نشط</span>
                  )}
                </td>
                <td className="p-3 text-center text-xs font-mono text-text3">
                  {new Date(u.created_at).toLocaleDateString("ar-SA")}
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant={u.suspended ? "gold" : "danger"}
                    onClick={() => toggleSuspend(u.id, u.suspended)}
                  >
                    {u.suspended ? "تفعيل" : "تعليق"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageTransition>
  );
}
