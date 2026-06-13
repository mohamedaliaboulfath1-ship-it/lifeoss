"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const PLACEHOLDER_BLUR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 4'%3E%3Crect fill='%231a1816' width='3' height='4'/%3E%3C/svg%3E";

export function BookCoverImage({
  title,
  coverUrl,
  coverPath,
  size = "full",
  className = "",
}: {
  title: string;
  coverUrl?: string | null;
  coverPath?: string | null;
  size?: "thumb" | "medium" | "full";
  className?: string;
}) {
  const [src, setSrc] = useState<string | null>(coverUrl ?? null);
  const dims =
    size === "thumb"
      ? { w: 64, h: 96 }
      : size === "medium"
        ? { w: 160, h: 240 }
        : { w: 280, h: 420 };

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
      const { data } = await supabase.storage
        .from("book-covers")
        .createSignedUrl(coverPath, 3600);
      if (!cancelled) setSrc(data?.signedUrl ?? null);
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [coverUrl, coverPath]);

  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const isFull = size === "full";

  if (!src) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-br from-[#2a2520] via-[#1a1816] to-[#0f0e0d] border border-white/5",
          isFull ? "w-full aspect-[3/4]" : "",
          className
        )}
        style={isFull ? undefined : { width: dims.w, height: dims.h }}
      >
        <span className="text-2xl font-bold text-white/20 tracking-widest">{initials || "—"}</span>
      </div>
    );
  }

  const isRemote = src.startsWith("http");

  return (
    <div
      className={cn(
        "relative overflow-hidden border border-white/10 shadow-premium",
        isFull ? "w-full aspect-[3/4]" : "",
        className
      )}
      style={isFull ? undefined : { width: dims.w, height: dims.h }}
    >
      {isRemote ? (
        <Image
          src={src}
          alt={title}
          fill
          sizes={`${dims.w}px`}
          className="object-cover"
          placeholder="blur"
          blurDataURL={PLACEHOLDER_BLUR}
          loading="lazy"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={title} className="w-full h-full object-cover" loading="lazy" />
      )}
    </div>
  );
}
