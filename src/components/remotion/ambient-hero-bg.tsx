"use client";

import { AmbientHero } from "@/remotion/compositions/ambient-hero";
import { RemotionEmbed } from "./remotion-embed";

export function AmbientHeroBg({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <RemotionEmbed
        component={AmbientHero}
        durationInFrames={240}
        width={720}
        height={320}
        inputProps={{}}
        loop
        playOnView={false}
        className="w-full h-full min-h-full [&_video]:object-cover"
      />
    </div>
  );
}
