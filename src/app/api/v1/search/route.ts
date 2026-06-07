import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getYearForUser } from "@/lib/year-data";
import { rateLimit } from "@/lib/rate-limit";

function fuzzyMatch(text: string, q: string) {
  const t = text.toLowerCase();
  const query = q.toLowerCase();
  if (t.includes(query)) return 1;
  const words = query.split(/\s+/).filter(Boolean);
  const hits = words.filter((w) => t.includes(w)).length;
  return words.length ? hits / words.length : 0;
}

export async function GET(req: Request) {
  const authResult = await requireSession();
  if ("error" in authResult) return authResult.error;

  const limited = rateLimit(`search:${authResult.userId}`, 90, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSec: limited.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [], query: q });
  }

  const { data } = await getYearForUser(authResult.userId);
  type Result = {
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    href: string;
    score: number;
  };

  const results: Result[] = [];

  const push = (
    type: string,
    id: string,
    title: string,
    subtitle: string | undefined,
    href: string,
    haystack: string
  ) => {
    const score = fuzzyMatch(haystack, q);
    if (score > 0.3) results.push({ id, type, title, subtitle, href, score });
  };

  for (const g of data.goals ?? []) {
    push("goal", g.id, g.title, g.area, `/goals`, `${g.title} ${g.area}`);
  }
  for (const h of data.habits ?? []) {
    push("habit", h.id, h.name, h.cat, `/habits`, `${h.name} ${h.cat}`);
  }
  for (const t of data.tasks ?? []) {
    push("task", t.id, t.title, t.status, `/tasks`, `${t.title} ${t.note ?? ""}`);
  }
  for (const b of data.books ?? []) {
    push("book", b.id, b.title, b.author, `/books`, `${b.title} ${b.author ?? ""}`);
  }
  for (const tx of data.transactions ?? []) {
    push(
      "finance",
      tx.id,
      tx.note ?? tx.cat ?? "معاملة",
      tx.type,
      `/finance`,
      `${tx.note ?? ""} ${tx.cat}`
    );
  }
  for (const c of data.careerCertifications ?? []) {
    push("cert", c.id, c.name, c.provider, `/career`, `${c.name} ${c.provider}`);
  }
  for (const c of data.careerCourses ?? []) {
    push("course", c.id, c.title, c.platform, `/learning`, `${c.title} ${c.platform}`);
  }
  results.sort((a, b) => b.score - a.score);

  return NextResponse.json({
    query: q,
    results: results.slice(0, 20),
  });
}
