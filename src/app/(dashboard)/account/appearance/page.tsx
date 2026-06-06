"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/contexts/theme-context";

const THEMES: { id: ThemeMode; label: string; desc: string }[] = [
  { id: "dark", label: "داكن", desc: "مريح للعمل الليلي" },
  { id: "light", label: "فاتح", desc: "وضوح في النهار" },
  { id: "system", label: "تلقائي", desc: "يتبع إعدادات النظام" },
];

export default function AccountAppearancePage() {
  const { theme, setTheme } = useTheme();

  return (
    <Card className="p-6 space-y-4 animate-fade-up">
      <h1 className="text-lg font-bold text-gold2">المظهر</h1>
      <p className="text-text3 text-sm">
        يُحفظ تلقائياً في المتصفح وفي حسابك — يتزامن بعد تسجيل الدخول.
      </p>
      <div className="grid gap-3">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={`text-right p-4 rounded-sm border transition-colors cursor-pointer ${
              theme === t.id
                ? "border-gold/50 bg-gold/10"
                : "border-border hover:border-border2"
            }`}
          >
            <div className="font-bold">{t.label}</div>
            <div className="text-xs text-text3">{t.desc}</div>
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" disabled>
        المزيد من التخصيص — قريباً
      </Button>
    </Card>
  );
}
