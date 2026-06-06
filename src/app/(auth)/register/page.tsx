"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleResendConfirmation() {
    if (!pendingEmail || !isSupabaseConfigured()) return;
    setResendLoading(true);
    setResendMessage(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: pendingEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setResendLoading(false);
    if (resendError) {
      setResendMessage("تعذّر إرسال الرابط. جرّب لاحقاً أو عطّل تأكيد البريد من Supabase.");
      return;
    }
    setResendMessage("تم إرسال رابط التأكيد مرة أخرى — راجع البريد ومجلد السبام.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("أضف مفاتيح Supabase في .env.local ثم أعد تشغيل npm run dev");
      return;
    }
    setLoading(true);
    setError(null);
    setPendingEmail(null);
    setResendMessage(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("already")
          ? "البريد مسجّل مسبقاً"
          : signUpError.message
      );
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Email confirmation enabled — sign in if allowed
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setPendingEmail(email.trim().toLowerCase());
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-[10px] p-8 animate-fade-up">
        <h1 className="font-display text-3xl font-black text-center bg-gradient-to-br from-gold to-gold3 bg-clip-text text-transparent mb-1">
          انضم إلى LifeOS
        </h1>
        <p className="text-center text-text3 text-xs mb-8">
          أنشئ حسابك وابدأ تتبع حياتك
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>الاسم</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
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
          <div>
            <Label>كلمة المرور (6 أحرف على الأقل)</Label>
            <Input
              type="password"
              required
              minLength={6}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {pendingEmail && (
            <div className="p-3 rounded-sm border border-amber/30 bg-amber/10 text-amber2 text-xs leading-relaxed space-y-2">
              <p className="font-medium">تم إنشاء الحساب — يحتاج تأكيد البريد</p>
              <p>
                أرسلنا رابطاً إلى <span dir="ltr">{pendingEmail}</span>. إن لم يصل،
                راجع السبام أو عطّل &quot;Confirm email&quot; من Supabase → Authentication →
                Providers → Email.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="w-full !py-2 text-xs"
                disabled={resendLoading}
                onClick={handleResendConfirmation}
              >
                {resendLoading ? "جاري الإرسال..." : "إعادة إرسال رابط التأكيد"}
              </Button>
              {resendMessage && <p>{resendMessage}</p>}
            </div>
          )}
          {error && <p className="text-rose2 text-sm">{error}</p>}
          <Button
            type="submit"
            variant="gold"
            className="w-full !py-2.5"
            disabled={loading}
          >
            {loading ? "جاري الإنشاء..." : "إنشاء حساب"}
          </Button>
        </form>
        <p className="text-center text-text3 text-xs mt-6">
          لديك حساب؟{" "}
          <Link href="/login" className="text-gold2 hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}
