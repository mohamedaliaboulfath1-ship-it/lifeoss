"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountSubscriptionPage() {
  return (
    <Card className="p-6 space-y-4 animate-fade-up">
      <h1 className="text-lg font-bold text-gold2">الاشتراك</h1>
      <div className="p-4 rounded-sm border border-gold/30 bg-gold/5">
        <div className="font-bold text-gold2">LifeOS Pro — مجاني</div>
        <p className="text-sm text-text3 mt-1">
          أنت على الخطة الحالية. الاشتراكات المدفوعة ستُفعَّل عند الجاهزية التجارية.
        </p>
      </div>
      <Button variant="ghost" disabled>
        ترقية الخطة — قريباً
      </Button>
    </Card>
  );
}
