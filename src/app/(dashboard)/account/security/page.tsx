"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/contexts/toast-context";
import { createClient } from "@/lib/supabase";

export default function AccountSecurityPage() {
  const { toast } = useToast();
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((json) => {
        setLastSignIn(json.lastSignIn ?? null);
        setEmail(json.email ?? "");
      })
      .catch(() => {});
  }, []);

  async function changePassword() {
    if (password.length < 6) {
      toast("كلمة المرور 6 أحرف على الأقل", "error");
      return;
    }
    if (password !== confirm) {
      toast("كلمتا المرور غير متطابقتين", "error");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast(error.message, "error");
      return;
    }
    setPassword("");
    setConfirm("");
    toast("تم تغيير كلمة المرور", "success");
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <Card className="p-6 space-y-4">
        <h1 className="text-lg font-bold text-gold2">الأمان</h1>
        <div className="text-sm space-y-2">
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-text3">البريد</span>
            <span dir="ltr">{email}</span>
          </div>
          <div className="flex justify-between border-b border-border/50 pb-2">
            <span className="text-text3">آخر تسجيل دخول</span>
            <span className="font-mono text-xs">
              {lastSignIn
                ? new Date(lastSignIn).toLocaleString("ar-SA")
                : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text3">الجلسة الحالية</span>
            <span className="text-emerald2 text-xs">نشطة</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-bold">تغيير كلمة المرور</h2>
        <div>
          <Label>كلمة المرور الجديدة</Label>
          <Input
            type="password"
            dir="ltr"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>
        <div>
          <Label>تأكيد كلمة المرور</Label>
          <Input
            type="password"
            dir="ltr"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={6}
          />
        </div>
        <Button variant="gold" onClick={changePassword} disabled={loading}>
          {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
        </Button>
      </Card>
    </div>
  );
}
