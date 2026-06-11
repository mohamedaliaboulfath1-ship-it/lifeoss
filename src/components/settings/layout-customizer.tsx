"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  WIDGET_OPTIONS,
  loadLayoutPrefs,
  saveLayoutPrefs,
  type LayoutPreferences,
} from "@/lib/preferences/layout";

export function LayoutCustomizer() {
  const [prefs, setPrefs] = useState<LayoutPreferences>(loadLayoutPrefs());

  useEffect(() => {
    setPrefs(loadLayoutPrefs());
  }, []);

  function toggleWidget(id: string) {
    const widgets = prefs.dashboardWidgets.includes(id)
      ? prefs.dashboardWidgets.filter((w) => w !== id)
      : [...prefs.dashboardWidgets, id];
    const next = saveLayoutPrefs({ dashboardWidgets: widgets });
    setPrefs(next);
  }

  function setAccent(theme: LayoutPreferences["accentTheme"]) {
    const next = saveLayoutPrefs({ accentTheme: theme });
    document.documentElement.setAttribute("data-accent", theme);
    setPrefs(next);
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", prefs.accentTheme);
  }, [prefs.accentTheme]);

  return (
    <Card className="p-4 space-y-4 glass-premium">
      <div className="text-sm font-bold text-gold2">تخصيص الواجهة</div>

      <div>
        <div className="text-xs text-text3 mb-2">ودجات لوحة التحكم</div>
        <div className="flex flex-wrap gap-2">
          {WIDGET_OPTIONS.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => toggleWidget(w.id)}
              className={`px-3 py-1.5 rounded-sm text-xs border transition-colors ${
                prefs.dashboardWidgets.includes(w.id)
                  ? "border-gold bg-gold/15 text-gold2"
                  : "border-border text-text3"
              }`}
            >
              {w.icon} {w.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-text3 mb-2">لون التمييز</div>
        <div className="flex gap-2">
          {(["gold", "indigo", "emerald", "sky"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAccent(t)}
              className={`px-3 py-1 rounded-sm text-xs border ${
                prefs.accentTheme === t ? "border-gold text-gold2" : "border-border"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-text3 mb-2">تخطيط المجالات</div>
        <div className="flex gap-2">
          {(["command", "grid", "list"] as const).map((l) => (
            <Button
              key={l}
              variant={prefs.areaLayout === l ? "gold" : "ghost"}
              size="sm"
              onClick={() => setPrefs(saveLayoutPrefs({ areaLayout: l }))}
            >
              {l}
            </Button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={prefs.compactMode}
          onChange={(e) => setPrefs(saveLayoutPrefs({ compactMode: e.target.checked }))}
        />
        وضع مضغوط
      </label>
    </Card>
  );
}
