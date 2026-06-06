import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { uid, today } from "@/lib/utils";

const entityEnum = z.enum([
  "job_application",
  "interview",
  "mentor",
  "network_contact",
]);

const postSchema = z.object({
  entity: entityEnum,
  payload: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const { entity, payload } = postSchema.parse(await req.json());
  const id = (payload.id as string) ?? uid();

  if (entity === "job_application") {
    const { error } = await authResult.supabase.from("job_applications").insert({
      id,
      user_id: authResult.userId,
      company: String(payload.company ?? ""),
      role_title: String(payload.role ?? ""),
      status: (payload.status as string) ?? "applied",
      applied_date: (payload.appliedAt as string) ?? today(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "interview") {
    const date = (payload.date as string) ?? today();
    const { error } = await authResult.supabase.from("interviews").insert({
      id,
      user_id: authResult.userId,
      interview_date: `${date}T12:00:00Z`,
      interview_type: (payload.stage as string) ?? "technical",
      outcome: (payload.result as string) ?? "pending",
      metadata: { company: payload.company ?? "شركة" },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  if (entity === "mentor") {
    const { error } = await authResult.supabase.from("mentors").insert({
      id,
      user_id: authResult.userId,
      name: String(payload.name ?? "Mentor جديد"),
      expertise: (payload.area as string) ?? "Finance Leadership",
      meeting_frequency: (payload.cadence as string) ?? "شهري",
      last_meeting_date: (payload.lastTouch as string) ?? today(),
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id });
  }

  const { error } = await authResult.supabase.from("networking_contacts").insert({
    id,
    user_id: authResult.userId,
    name: String(payload.name ?? "Contact جديد"),
    company: (payload.company as string) ?? null,
    role_title: (payload.role as string) ?? null,
    metadata: {
      channel: payload.channel ?? "linkedin",
      lastContact: payload.lastContact ?? today(),
      nextFollowUp: payload.nextFollowUp ?? null,
    },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id });
}
