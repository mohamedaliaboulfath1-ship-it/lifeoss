"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("إعداد Supabase ناقص");
      return;
    }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-[10px] p-8 animate-fade-up">
        <h1 className="font-display text-2xl font-black text-center text-gold2 mb-1">
          استعادة كلمة المرور
        </h1>
        <p className="text-center text-text3 text-xs mb-8">
          أدخل بريدك وسنرسل رابط إعادة التعيين
        </p>

        {sent ? (
          <div className="p-4 rounded-sm border border-emerald/30 bg-emerald/10 text-emerald2 text-sm space-y-3">
            <p>إذا كان البريد مسجّلاً، ستصلك رسالة برابط إعادة التعيين.</p>
            <p className="text-xs text-text3">راجع مجلد السبام إن لم تصل الرسالة.</p>
            <Link href="/login" className="text-gold2 text-sm hover:underline block text-center">
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>البريد الإلكتروني</Label>
              <Input
                type="email"
                required
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-rose2 text-sm">{error}</p>}
            <Button type="submit" variant="gold" className="w-full !py-2.5" disabled={loading}>
              {loading ? "جاري الإرسال..." : "إرسال الرابط"}
            </Button>
            <p className="text-center text-text3 text-xs">
              <Link href="/login" className="text-gold2 hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
