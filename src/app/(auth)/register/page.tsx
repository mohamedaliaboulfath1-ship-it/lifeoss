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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      setError("أضف مفاتيح Supabase في .env.local ثم أعد تشغيل npm run dev");
      return;
    }
    setLoading(true);
    setError(null);

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
      setError(
        "تم إنشاء الحساب — راجع بريدك لتأكيد الحساب ثم سجّل الدخول."
      );
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
