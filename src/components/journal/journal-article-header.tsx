"use client";

import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/types/journal";
import { JOURNAL_CATEGORIES } from "@/lib/journal/blocks";

interface ArticleHeaderProps {
  entry: JournalEntry;
  readOnly?: boolean;
  onTitleChange?: (title: string) => void;
  onSubtitleChange?: (subtitle: string) => void;
  onCoverUpload?: (file: File) => void;
}

export function JournalArticleHeader({
  entry,
  readOnly,
  onTitleChange,
  onSubtitleChange,
  onCoverUpload,
}: ArticleHeaderProps) {
  const cat = JOURNAL_CATEGORIES.find((c) => c.id === entry.category);

  return (
    <header className="space-y-4">
      {entry.coverUrl ? (
        <div className="relative -mx-4 md:-mx-8 h-48 md:h-64 rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={entry.coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
        </div>
      ) : !readOnly ? (
        <label className="block h-32 rounded-2xl border border-dashed border-gold/30 bg-gradient-to-br from-gold/5 to-sky/5 cursor-pointer hover:border-gold/50 transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f && onCoverUpload) onCoverUpload(f);
            }}
          />
          <span className="flex items-center justify-center h-full text-sm text-text3">
            + صورة غلاف
          </span>
        </label>
      ) : null}

      <div className="space-y-2">
        {readOnly ? (
          <h1 className="font-display text-3xl md:text-4xl font-black text-text leading-tight">
            {entry.title}
          </h1>
        ) : (
          <input
            value={entry.title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="w-full font-display text-3xl md:text-4xl font-black bg-transparent outline-none text-text"
            placeholder="عنوان المقال"
          />
        )}
        {readOnly ? (
          entry.subtitle && <p className="text-lg text-text2">{entry.subtitle}</p>
        ) : (
          <input
            value={entry.subtitle ?? ""}
            onChange={(e) => onSubtitleChange?.(e.target.value)}
            className="w-full text-lg bg-transparent outline-none text-text2"
            placeholder="عنوان فرعي"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-text3 font-mono">
        {cat && <span>{cat.icon} {cat.label}</span>}
        {entry.author && <span>✍️ {entry.author}</span>}
        <span>📅 {new Date(entry.createdAt).toLocaleDateString("ar-SA")}</span>
        <span>🔄 {new Date(entry.updatedAt).toLocaleDateString("ar-SA")}</span>
        <span>⏱ {entry.readingTimeMin} د قراءة</span>
        <span>📝 {entry.wordCount} كلمة</span>
      </div>
    </header>
  );
}
