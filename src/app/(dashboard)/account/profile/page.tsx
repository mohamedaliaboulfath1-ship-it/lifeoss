"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/contexts/toast-context";
import { useLifeOS } from "@/contexts/lifeos-context";
import { createClient } from "@/lib/supabase";

interface AccountData {
  profile: {
    displayName: string;
    avatarUrl: string | null;
    timezone: string;
    language: string;
    bio: string | null;
    city: string | null;
  };
  email: string | null;
}

export default function AccountProfilePage() {
  const { toast } = useToast();
  const { refreshSilent } = useLifeOS();
  const [data, setData] = useState<AccountData | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast("فشل تحميل الملف", "error"));
  }, [toast]);

  async function save() {
    if (!data) return;
    setSaving(true);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: data.profile.displayName,
        timezone: data.profile.timezone,
        language: data.profile.language,
        bio: data.profile.bio,
        city: data.profile.city,
        avatarUrl: data.profile.avatarUrl,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast("فشل الحفظ", "error");
      return;
    }
    const json = await res.json();
    setData(json);
    await refreshSilent();
    toast("تم حفظ الملف الشخصي", "success");
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setUploading(false);
      return;
    }
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${uid}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      toast("فشل رفع الصورة — تأكد من تشغيل migration 008", "error");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setData((prev) =>
      prev
        ? {
            ...prev,
            profile: { ...prev.profile, avatarUrl: urlData.publicUrl },
          }
        : prev
    );
    setUploading(false);
    toast("تم رفع الصورة — اضغط حفظ", "success");
  }

  if (!data) {
    return <p className="text-text3 text-sm">جاري التحميل...</p>;
  }

  const p = data.profile;

  return (
    <Card className="p-6 space-y-5 animate-fade-up">
      <h1 className="text-lg font-bold text-gold2">الملف الشخصي</h1>

      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-sky flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
          {p.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            p.displayName.charAt(0)
          )}
        </div>
        <div>
          <Label className="!mb-1">صورة الملف</Label>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
            }}
            className="text-xs text-text3"
          />
        </div>
      </div>

      <div>
        <Label>الاسم المعروض</Label>
        <Input
          value={p.displayName}
          onChange={(e) =>
            setData({
              ...data,
              profile: { ...p, displayName: e.target.value },
            })
          }
        />
      </div>

      <div>
        <Label>البريد الإلكتروني</Label>
        <Input value={data.email ?? ""} dir="ltr" disabled className="opacity-70" />
        <p className="text-[10px] text-text3 mt-1">البريد يُدار عبر Supabase Auth</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>المنطقة الزمنية</Label>
          <select
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
            value={p.timezone}
            onChange={(e) =>
              setData({ ...data, profile: { ...p, timezone: e.target.value } })
            }
          >
            <option value="Asia/Riyadh">الرياض (GMT+3)</option>
            <option value="Africa/Cairo">القاهرة (GMT+2)</option>
            <option value="Europe/London">لندن</option>
            <option value="America/New_York">نيويورك</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div>
          <Label>اللغة</Label>
          <select
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm"
            value={p.language}
            onChange={(e) =>
              setData({
                ...data,
                profile: { ...p, language: e.target.value as "ar" | "en" },
              })
            }
          >
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      <div>
        <Label>نبذة</Label>
        <textarea
          className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-sm min-h-[80px]"
          value={p.bio ?? ""}
          onChange={(e) =>
            setData({ ...data, profile: { ...p, bio: e.target.value } })
          }
          maxLength={500}
        />
      </div>

      <Button variant="gold" onClick={save} disabled={saving}>
        {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
      </Button>
    </Card>
  );
}
