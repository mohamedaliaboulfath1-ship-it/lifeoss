import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { buildGlobalLifeMap } from "@/lib/life-map/build-global-graph";

export async function GET() {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { supabase, userId } = auth;

  const [goalsRes, tasksRes, habitsRes, booksRes, skillsRes] = await Promise.all([
    supabase
      .from("goals")
      .select("id, title, level, parent_id, progress, domain_id, area, category")
      .eq("user_id", userId)
      .in("status", ["active", "paused"]),
    supabase
      .from("life_tasks")
      .select("id, title, goal_id")
      .eq("user_id", userId)
      .in("status", ["inbox", "active"]),
    supabase
      .from("habits")
      .select("id, name, goal_id, project_id")
      .eq("user_id", userId)
      .eq("active", true),
    supabase
      .from("books")
      .select("id, title, goal_id, domain_id")
      .eq("user_id", userId)
      .in("status", ["planned", "reading"]),
    supabase
      .from("skills")
      .select("id, name, linked_goal_id")
      .eq("user_id", userId),
  ]);

  if (goalsRes.error) {
    return NextResponse.json({ error: goalsRes.error.message }, { status: 500 });
  }

  const map = buildGlobalLifeMap({
    goals: goalsRes.data ?? [],
    tasks: tasksRes.data ?? [],
    habits: habitsRes.data ?? [],
    books: booksRes.data ?? [],
    skills: skillsRes.data ?? [],
  });

  return NextResponse.json(map);
}
