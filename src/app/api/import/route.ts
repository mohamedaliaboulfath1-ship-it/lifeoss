import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { parseYearPayload, saveLifeYearPayload } from "@/lib/year-data";
import type { Goal, Habit, WeightLog } from "@/types/lifeos";

const importSchema = z.object({
  profile: z
    .object({
      name: z.string().optional(),
      city: z.string().optional(),
      age: z.number().optional(),
      height: z.number().optional(),
      startWeight: z.number().optional(),
      targetWeight: z.number().optional(),
      salary: z.number().optional(),
      targetSalary: z.number().optional(),
      startDate: z.string().optional(),
    })
    .optional(),
  currentYear: z.string().optional(),
  years: z.record(z.unknown()).optional(),
});

/** Import legacy localStorage export from LifeOS HTML */
export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const body = importSchema.parse(await req.json());

  if (body.profile) {
    const p = body.profile;
    await authResult.supabase
      .from("profiles")
      .update({
        display_name: p.name,
        city: p.city,
        age: p.age,
        height: p.height,
        start_weight: p.startWeight,
        target_weight: p.targetWeight,
        salary: p.salary,
        target_salary: p.targetSalary,
        start_date: p.startDate,
        current_year: body.currentYear,
        onboarded: true,
      })
      .eq("id", authResult.userId);
  }

  if (body.years) {
    for (const [year, raw] of Object.entries(body.years)) {
      const data = parseYearPayload(raw);

      await saveLifeYearPayload(authResult.userId, year, data);

      if (data.goals.length) {
        await authResult.supabase.from("goals").upsert(
          data.goals.map((g: Goal) => ({
            id: g.id,
            user_id: authResult.userId,
            year,
            title: g.title,
            area: g.area,
            priority: g.priority,
            start_date: g.start || null,
            due_date: g.due || null,
            current_val: g.current || null,
            target_val: g.target || null,
            unit: g.unit || null,
            done: g.done ?? false,
            tasks: g.tasks ?? [],
            habits: g.habits || null,
          }))
        );
      }

      if (data.habits.length) {
        await authResult.supabase.from("habits").upsert(
          data.habits.map((h: Habit) => ({
            id: h.id,
            user_id: authResult.userId,
            year,
            name: h.name,
            cat: h.cat,
            freq: h.freq,
            time: h.time || null,
            dur: h.dur ?? null,
            goal_link: h.goalLink || null,
            note: h.note || null,
          }))
        );

        const logRows: {
          habit_id: string;
          user_id: string;
          log_date: string;
          done: boolean;
        }[] = [];
        for (const habit of data.habits) {
          const dates = data.habitLogs[habit.id] ?? {};
          for (const [log_date, done] of Object.entries(dates)) {
            if (done) {
              logRows.push({
                habit_id: habit.id,
                user_id: authResult.userId,
                log_date,
                done: true,
              });
            }
          }
        }
        if (logRows.length) {
          await authResult.supabase.from("habit_logs").upsert(logRows, {
            onConflict: "habit_id,log_date",
          });
        }
      }

      if (data.weightLogs.length) {
        await authResult.supabase.from("weight_logs").upsert(
          data.weightLogs.map((w: WeightLog) => ({
            id: w.id,
            user_id: authResult.userId,
            log_date: w.date,
            weight: w.weight,
            sleep: w.sleep ?? null,
            cals: w.cals ?? null,
            note: w.note || null,
          }))
        );
      }
    }
  }

  return NextResponse.json({ ok: true });
}
