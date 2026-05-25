"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configError = searchParams.get("error") === "config";
  const supabaseReady = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    configError
      ? "إعداد Supabase ناقص — أضف المفاتيح في ملف .env.local ثم أعد تشغيل السيرفر"
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabaseReady) {
      setError(
        "أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في .env.local"
      );
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("البريد أو كلمة المرور غير صحيحة");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md bg-surface border border-border rounded-[10px] p-8 animate-fade-up">
      <h1 className="font-display text-3xl font-black text-center bg-gradient-to-br from-gold to-gold3 bg-clip-text text-transparent mb-1">
        LifeOS ✦
      </h1>
      <p className="text-center text-text3 text-xs mb-8 font-mono">
        تسجيل الدخول إلى مركز التحكم
      </p>
      {!supabaseReady && (
        <div className="mb-4 p-3 rounded-sm border border-amber/30 bg-amber/10 text-amber2 text-xs leading-relaxed">
          أنشئ ملف <code dir="ltr">.env.local</code> من{" "}
          <code dir="ltr">.env.local.example</code> والصق مفاتيح Supabase من
          لوحة التحكم → Settings → API.
        </div>
      )}
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
        <div>
          <Label>كلمة المرور</Label>
          <Input
            type="password"
            required
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
          {loading ? "جاري الدخول..." : "دخول"}
        </Button>
      </form>
      <p className="text-center text-text3 text-xs mt-6">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="text-gold2 hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="text-text3 text-sm">جاري التحميل...</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
