import type { SupabaseClient } from "@supabase/supabase-js";
import { today } from "@/lib/utils";

/** Seed actionable notifications when inbox is empty (idempotent per day) */
export async function seedDailyNotifications(
  db: SupabaseClient,
  userId: string
) {
  const todayStr = today();
  const dayKey = `seed_${todayStr}`;

  const { count } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", `${todayStr}T00:00:00`);

  if ((count ?? 0) > 0) return;

  const [habitsRes, tasksRes, goalsRes] = await Promise.all([
    db.from("habits").select("id, name").eq("user_id", userId).eq("active", true).limit(20),
    db
      .from("life_tasks")
      .select("id, title, due_date")
      .eq("user_id", userId)
      .in("status", ["inbox", "active"])
      .lte("due_date", todayStr)
      .limit(5),
    db
      .from("goals")
      .select("id, title, progress, target_date, due_date")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .limit(10),
  ]);

  const rows: Array<{
    user_id: string;
    type: string;
    priority: string;
    title: string;
    body: string | null;
    action_url: string;
    entity_type: string | null;
    entity_id: string | null;
  }> = [];

  const habitIds = new Set(
    (
      await db
        .from("habit_logs")
        .select("habit_id")
        .eq("user_id", userId)
        .eq("log_date", todayStr)
        .eq("done", true)
    ).data?.map((l) => l.habit_id) ?? []
  );

  for (const h of habitsRes.data ?? []) {
    if (!habitIds.has(h.id)) {
      rows.push({
        user_id: userId,
        type: "reminder",
        priority: "high",
        title: `عادة اليوم: ${h.name}`,
        body: "لم تُسجّل بعد — أكملها الآن",
        action_url: "/habits",
        entity_type: "habit",
        entity_id: h.id,
      });
      if (rows.length >= 3) break;
    }
  }

  for (const t of tasksRes.data ?? []) {
    rows.push({
      user_id: userId,
      type: "deadline",
      priority: "urgent",
      title: `مهمة مستحقة: ${t.title}`,
      body: t.due_date ? `الموعد: ${t.due_date}` : null,
      action_url: "/tasks",
      entity_type: "task",
      entity_id: t.id,
    });
    if (rows.length >= 5) break;
  }

  for (const g of goalsRes.data ?? []) {
    const due = g.target_date ?? g.due_date;
    if (!due) continue;
    const days = Math.round((new Date(due).getTime() - Date.now()) / 86400000);
    if (days < 0 || (g.progress ?? 0) < 40) {
      rows.push({
        user_id: userId,
        type: "alert",
        priority: days < 0 ? "urgent" : "normal",
        title: `هدف يحتاج انتباه: ${g.title}`,
        body: days < 0 ? `متأخر ${Math.abs(days)} يوم` : `${g.progress ?? 0}% تقدم`,
        action_url: "/goals",
        entity_type: "goal",
        entity_id: g.id,
      });
      if (rows.length >= 7) break;
    }
  }

  if (rows.length === 0) {
    rows.push({
      user_id: userId,
      type: "achievement",
      priority: "low",
      title: "يوم نظيف — استمر!",
      body: "لا مهام عاجلة. ركّز على هدف واحد مهم.",
      action_url: "/dashboard",
      entity_type: null,
      entity_id: dayKey,
    });
  }

  await db.from("notifications").insert(rows.slice(0, 8));
}
