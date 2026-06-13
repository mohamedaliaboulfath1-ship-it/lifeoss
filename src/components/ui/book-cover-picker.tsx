"use client";

import { useCallback, useRef, useState } from "react";
import { Label } from "@/components/ui/input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/dashboard/book-cover";
import { fetchBookCoverUrl } from "@/lib/books/fetch-book-cover";
import { cn } from "@/lib/utils";

type BookCoverPickerProps = {
  title: string;
  author?: string;
  coverUrl: string;
  coverPreview: string | null;
  onCoverUrlChange: (url: string) => void;
  onFileSelect: (file: File) => Promise<void>;
  disabled?: boolean;
};

export function BookCoverPicker({
  title,
  author,
  coverUrl,
  coverPreview,
  onCoverUrlChange,
  onFileSelect,
  disabled,
}: BookCoverPickerProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fetching, setFetching] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const preview = coverPreview || coverUrl || undefined;

  const handleAutoFetch = useCallback(async () => {
    if (!title.trim()) return;
    setFetching(true);
    try {
      const url = await fetchBookCoverUrl(title, author);
      if (url) onCoverUrlChange(url);
    } finally {
      setFetching(false);
    }
  }, [title, author, onCoverUrlChange]);

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) await onFileSelect(file);
  }

  return (
    <div className="space-y-3">
      <Label>غلاف الكتاب</Label>
      <div className="flex gap-4 items-start">
        <div className="w-28 shrink-0 aspect-[3/4] rounded-md overflow-hidden border border-border bg-surface2">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="معاينة الغلاف" className="w-full h-full object-cover" />
          ) : (
            <BookCover title={title || "كتاب"} coverUrl={null} coverPath={null} />
          )}
        </div>
        <div className="flex-1 space-y-3 min-w-0">
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
              dragOver ? "border-gold bg-gold/5" : "border-border2 hover:border-gold/40"
            )}
          >
            <div className="text-xs text-text3">
              اسحب صورة هنا أو انقر للرفع
              <br />
              <span className="text-[10px]">JPEG · PNG · WebP</span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={disabled}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await onFileSelect(f);
              }}
            />
          </div>
          <div>
            <Label className="text-[10px]">أو الصق رابط الغلاف</Label>
            <Input
              value={coverUrl}
              onChange={(e) => onCoverUrlChange(e.target.value)}
              placeholder="https://covers.openlibrary.org/..."
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || fetching || !title.trim()}
            onClick={handleAutoFetch}
          >
            {fetching ? "جاري البحث..." : "🔍 جلب الغلاف تلقائياً"}
          </Button>
        </div>
      </div>
    </div>
  );
}
