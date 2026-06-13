"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { JournalArticleHeader } from "./journal-article-header";
import { JournalBlockList } from "./journal-block-list";
import { JournalAiPanel } from "./journal-ai-panel";
import { JournalFormatToolbar, applyRichFormat } from "./journal-format-toolbar";
import type { JournalEntry, JournalRelation, MentionResult } from "@/types/journal";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/toast-context";

interface EditorViewProps {
  entryId: string;
}

export function JournalEditorView({ entryId }: EditorViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [relations, setRelations] = useState<Omit<JournalRelation, "id" | "entryId">[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/journal/${entryId}`);
    const json = await res.json();
    if (!res.ok) {
      toast(json.error ?? "فشل التحميل", "error");
      router.push("/journal");
      return;
    }
    setEntry(json.entry);
    setRelations(
      (json.entry.relations ?? []).map(
        (r: JournalRelation) => ({
          blockId: r.blockId,
          targetType: r.targetType,
          targetId: r.targetId,
          label: r.label,
        })
      )
    );
    setLoading(false);
  }, [entryId, router, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (patch?: Partial<JournalEntry>) => {
      if (!entry) return;
      setSaving(true);
      const payload = { ...entry, ...patch };
      try {
        const res = await fetch(`/api/journal/${entryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: payload.title,
            subtitle: payload.subtitle,
            author: payload.author,
            category: payload.category,
            coverImagePath: payload.coverImagePath,
            status: payload.status,
            tags: payload.tags,
            blocks: payload.blocks,
            relations,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (json.entry) setEntry(json.entry);
      } catch {
        toast("فشل الحفظ", "error");
      } finally {
        setSaving(false);
      }
    },
    [entry, entryId, relations, toast]
  );

  function scheduleSave(patch?: Partial<JournalEntry>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void save(patch), 1500);
  }

  function patchEntry(patch: Partial<JournalEntry>) {
    setEntry((e) => (e ? { ...e, ...patch } : e));
    scheduleSave(patch);
  }

  async function uploadCover(file: File) {
    const form = new FormData();
    form.append("file", file);
    form.append("entryId", entryId);
    const res = await fetch("/api/journal/images", { method: "POST", body: form });
    const json = await res.json();
    if (res.ok && json.image?.storagePath) {
      patchEntry({
        coverImagePath: json.image.storagePath,
        coverUrl: json.image.url,
      });
      await save({
        ...entry!,
        coverImagePath: json.image.storagePath,
        coverUrl: json.image.url,
      });
    }
  }

  function addRelation(m: MentionResult, blockId: string) {
    setRelations((prev) => [
      ...prev,
      {
        blockId,
        targetType: m.type,
        targetId: m.id,
        label: m.label,
      },
    ]);
    scheduleSave();
  }

  if (loading || !entry) {
    return <div className="h-96 skeleton-shimmer rounded-2xl" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "max-w-3xl mx-auto",
        readingMode && "max-w-2xl"
      )}
    >
      <div className="flex items-center justify-between mb-6 gap-2 flex-wrap">
        <Link href="/journal" className="text-sm text-text3 hover:text-gold2">
          ← Journal OS
        </Link>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReadingMode((r) => !r)}
          >
            {readingMode ? "✏️ تحرير" : "📖 قراءة"}
          </Button>
          <Link href="/journal/graph">
            <Button variant="ghost" size="sm">🕸️ Graph</Button>
          </Link>
          <Button
            variant="gold"
            size="sm"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "حفظ…" : "حفظ"}
          </Button>
        </div>
      </div>

      <article
        className={cn(
          "rounded-2xl border border-border2 p-6 md:p-10 space-y-8",
          "glass-premium shadow-premium-lg",
          readingMode && "border-transparent shadow-none bg-transparent"
        )}
      >
        <JournalArticleHeader
          entry={entry}
          readOnly={readingMode}
          onTitleChange={(title) => patchEntry({ title })}
          onSubtitleChange={(subtitle) => patchEntry({ subtitle })}
          onCoverUpload={uploadCover}
        />

        {!readingMode && (
          <JournalFormatToolbar onFormat={applyRichFormat} />
        )}

        <JournalBlockList
          blocks={entry.blocks}
          readOnly={readingMode}
          entryId={entryId}
          onChange={(blocks) => patchEntry({ blocks })}
          onRelationsAdd={addRelation}
        />

        {entry.relations.length > 0 && (
          <div className="pt-4 border-t border-border/60">
            <div className="text-xs text-text3 mb-2">روابط LifeOS</div>
            <div className="flex flex-wrap gap-2">
              {entry.relations.map((r) => (
                <span
                  key={r.id}
                  className="text-xs px-2 py-1 rounded-full bg-sky/15 text-sky2 border border-sky2/20"
                >
                  @{r.label ?? r.targetId}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {!readingMode && (
        <div className="mt-6">
          <JournalAiPanel
            title={entry.title}
            blocks={entry.blocks}
            onApplyBlocks={(newBlocks) =>
              patchEntry({ blocks: [...entry.blocks, ...newBlocks] })
            }
          />
        </div>
      )}
    </motion.div>
  );
}
