"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

export function BookCover({
  title,
  coverUrl,
  coverPath,
  className = "w-full h-full object-cover",
  fallbackClass = "text-4xl",
}: {
  title: string;
  coverUrl?: string | null;
  coverPath?: string | null;
  className?: string;
  fallbackClass?: string;
}) {
  const [src, setSrc] = useState<string | null>(coverUrl ?? null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (coverUrl) {
        setSrc(coverUrl);
        return;
      }
      if (!coverPath) {
        setSrc(null);
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("book-covers")
        .createSignedUrl(coverPath, 3600);
      if (!cancelled) {
        setSrc(error ? null : (data?.signedUrl ?? null));
      }
    }

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [coverUrl, coverPath]);

  if (!src) {
    return <span className={fallbackClass}>📖</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={title}
      className={className}
      onError={() => setSrc(null)}
    />
  );
}
