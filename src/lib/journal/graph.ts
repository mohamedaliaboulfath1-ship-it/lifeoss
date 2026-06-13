import type { SupabaseClient } from "@supabase/supabase-js";
import type { JournalGraphEdge, JournalGraphNode, MentionResult } from "@/types/journal";

export async function searchMentions(
  db: SupabaseClient,
  userId: string,
  query: string
): Promise<MentionResult[]> {
  const q = query.trim().toLowerCase();
  const results: MentionResult[] = [];

  const [goals, tasks, books, habits, areas] = await Promise.all([
    db.from("goals").select("id, title, level").eq("user_id", userId).limit(30),
    db.from("life_tasks").select("id, title").eq("user_id", userId).limit(30),
    db.from("books").select("id, title").eq("user_id", userId).limit(30),
    db.from("habits").select("id, name").eq("user_id", userId).limit(30),
    db.from("life_domains").select("id, name_ar, slug").or(`user_id.eq.${userId},user_id.is.null`).limit(20),
  ]);

  for (const g of goals.data ?? []) {
    const label = String(g.title);
    if (!q || label.toLowerCase().includes(q)) {
      const level = g.level as string;
      results.push({
        id: g.id as string,
        type: level === "project" ? "project" : "goal",
        label,
        href: `/goals/${g.id}`,
      });
    }
  }

  for (const t of tasks.data ?? []) {
    const label = String(t.title);
    if (!q || label.toLowerCase().includes(q)) {
      results.push({
        id: t.id as string,
        type: "task",
        label,
        href: "/tasks",
      });
    }
  }

  for (const b of books.data ?? []) {
    const label = String(b.title);
    if (!q || label.toLowerCase().includes(q)) {
      results.push({
        id: b.id as string,
        type: "book",
        label,
        href: "/books",
      });
    }
  }

  for (const h of habits.data ?? []) {
    const label = String(h.name);
    if (!q || label.toLowerCase().includes(q)) {
      results.push({
        id: h.id as string,
        type: "habit",
        label,
        href: "/habits",
      });
    }
  }

  for (const a of areas.data ?? []) {
    const label = String(a.name_ar ?? a.slug);
    if (!q || label.toLowerCase().includes(q)) {
      results.push({
        id: a.id as string,
        type: "area",
        label,
        href: `/areas/${a.slug ?? a.id}`,
      });
    }
  }

  return results.slice(0, 12);
}

export async function buildJournalGraph(
  db: SupabaseClient,
  userId: string
): Promise<{ nodes: JournalGraphNode[]; edges: JournalGraphEdge[] }> {
  const [entries, relations, goals, tasks, books, habits] = await Promise.all([
    db.from("journal_entries").select("id, title, category").eq("user_id", userId).neq("status", "archived"),
    db.from("journal_relations").select("*").eq("user_id", userId),
    db.from("goals").select("id, title, level").eq("user_id", userId).limit(40),
    db.from("life_tasks").select("id, title").eq("user_id", userId).limit(40),
    db.from("books").select("id, title").eq("user_id", userId).limit(40),
    db.from("habits").select("id, name").eq("user_id", userId).limit(40),
  ]);

  const nodes: JournalGraphNode[] = [];
  const edges: JournalGraphEdge[] = [];
  const nodeIds = new Set<string>();

  function addNode(node: JournalGraphNode) {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  }

  for (const e of entries.data ?? []) {
    addNode({
      id: `note:${e.id}`,
      type: "note",
      label: String(e.title),
      href: `/journal/${e.id}`,
      category: e.category as string,
    });
  }

  for (const g of goals.data ?? []) {
    const type = g.level === "project" ? "project" : "goal";
    addNode({
      id: `${type}:${g.id}`,
      type: type as JournalGraphNode["type"],
      label: String(g.title),
      href: `/goals/${g.id}`,
    });
  }

  for (const t of tasks.data ?? []) {
    addNode({ id: `task:${t.id}`, type: "task", label: String(t.title), href: "/tasks" });
  }

  for (const b of books.data ?? []) {
    addNode({ id: `book:${b.id}`, type: "book", label: String(b.title), href: "/books" });
  }

  for (const h of habits.data ?? []) {
    addNode({ id: `habit:${h.id}`, type: "habit", label: String(h.name), href: "/habits" });
  }

  for (const r of relations.data ?? []) {
    const source = `note:${r.entry_id}`;
    const target = `${r.target_type}:${r.target_id}`;
    if (nodeIds.has(source) && nodeIds.has(target)) {
      edges.push({
        id: `rel:${r.id}`,
        source,
        target,
        label: (r.label as string | null) ?? undefined,
      });
    }
  }

  return { nodes, edges };
}
