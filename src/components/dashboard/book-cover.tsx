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
    const initials = title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2a2520] via-[#1a1816] to-[#0f0e0d] p-3 ${fallbackClass}`}
      >
        <span className="text-sm font-bold text-white/25 tracking-wider text-center leading-tight">
          {initials || "—"}
        </span>
      </div>
    );
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
