import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/api-auth";
import { resolveDomainId } from "@/lib/domains";
import { uid } from "@/lib/utils";

const schema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  resourceType: z.enum(["note", "link", "doc", "reference"]).default("reference"),
  domainId: z.string().optional(),
  area: z.string().optional(),
  url: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
  goalId: z.string().optional(),
  projectId: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const status = new URL(req.url).searchParams.get("status") ?? "active";
  const { data, error } = await auth.supabase
    .from("para_resources")
    .select("*")
    .eq("user_id", auth.userId)
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (error) {
    const missing = error.message.includes("does not exist");
    return NextResponse.json(
      { error: error.message, migrationRequired: missing, resources: [] },
      { status: missing ? 400 : 500 }
    );
  }

  const resources = (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    resourceType: r.resource_type,
    domainId: r.domain_id,
    url: r.url,
    content: r.content,
    status: r.status,
    goalId: (r.metadata as Record<string, unknown> | null)?.goalId,
    projectId: (r.metadata as Record<string, unknown> | null)?.projectId,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ resources });
}

export async function POST(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const body = schema.parse(await req.json());
  const id = body.id ?? uid();
  const domainId = body.domainId ?? resolveDomainId(body.area);

  const { error } = await auth.supabase.from("para_resources").upsert({
    id,
    user_id: auth.userId,
    title: body.title,
    resource_type: body.resourceType,
    domain_id: domainId,
    url: body.url ?? null,
    content: body.content ?? null,
    status: body.status ?? "active",
    metadata: {
      goalId: body.goalId ?? null,
      projectId: body.projectId ?? null,
    },
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await auth.supabase
    .from("para_resources")
    .delete()
    .eq("id", id)
    .eq("user_id", auth.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
