"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLifeOSData } from "@/contexts/lifeos-context";
import {
  SUBSCRIPTION_PLANS,
  FEATURE_FLAGS,
  getUserPlan,
} from "@/lib/tenant/subscription";
import { cn } from "@/lib/utils";

export default function AccountSubscriptionPage() {
  const { data } = useLifeOSData();
  const currentPlan = getUserPlan(data?.profile.saas?.plan);

  return (
    <Card className="p-6 space-y-6 animate-fade-up">
      <div>
        <h1 className="text-lg font-bold text-gold2">الاشتراك</h1>
        <p className="text-sm text-text3 mt-1">
          خطط SaaS جاهزة — الفوترة غير مفعّلة بعد (Feature Flags فقط).
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const active = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={cn(
                "p-4 rounded-xl border transition-colors",
                active
                  ? "border-gold bg-gold/10 ring-1 ring-gold/30"
                  : "border-border2 bg-surface/50",
                plan.highlighted && !active && "border-sky2/40"
              )}
            >
              <div className="font-bold text-base">{plan.name}</div>
              <div className="text-gold2 font-mono text-sm mt-1">{plan.price}</div>
              <p className="text-xs text-text3 mt-2">{plan.description}</p>
              <ul className="mt-3 space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-xs text-text2">
                    ✓ {f}
                  </li>
                ))}
              </ul>
              {active && (
                <span className="inline-block mt-3 text-[10px] font-mono text-mint">
                  الخطة الحالية
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-sm border border-border2 bg-surface2/40 text-sm text-text2">
        الفوترة:{" "}
        {FEATURE_FLAGS.billingEnabled ? "مفعّلة" : "معطّلة — جاهزة للتفعيل لاحقاً"}
      </div>

      <Button variant="ghost" disabled>
        ترقية الخطة — قريباً
      </Button>
    </Card>
  );
}
