"use client";

import { useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import { useInViewEnter } from "@/hooks/use-in-view-enter";

const Player = dynamic(
  () => import("@remotion/player").then((m) => m.Player),
  { ssr: false, loading: () => null }
);

type RemotionEmbedProps<T extends Record<string, unknown>> = {
  component: ComponentType<T>;
  durationInFrames: number;
  fps?: number;
  width: number;
  height: number;
  inputProps: T;
  className?: string;
  /** false = play once per in-view enter (default). true = continuous loop (ambient only). */
  loop?: boolean;
  playerKey?: string | number;
  playOnView?: boolean;
};

export function RemotionEmbed<T extends Record<string, unknown>>({
  component,
  durationInFrames,
  fps = 30,
  width,
  height,
  inputProps,
  className = "",
  loop = false,
  playerKey,
  playOnView = true,
}: RemotionEmbedProps<T>) {
  const [mounted, setMounted] = useState(false);
  const inView = useInViewEnter(0.12);
  const enterCount = playOnView ? inView.enterCount : 1;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={className}
        style={{ width, height, maxWidth: "100%" }}
        aria-hidden
      />
    );
  }

  const showPlayer = enterCount > 0;
  const remountKey = `${playerKey ?? "embed"}-${enterCount}`;

  return (
    <div
      ref={playOnView ? inView.ref : undefined}
      className={className}
      style={{ width, height, maxWidth: "100%" }}
    >
      {showPlayer && (
        <Player
          key={remountKey}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          component={component as ComponentType<any>}
          durationInFrames={durationInFrames}
          compositionWidth={width}
          compositionHeight={height}
          fps={fps}
          inputProps={inputProps}
          loop={loop}
          autoPlay
          controls={false}
          clickToPlay={false}
          showVolumeControls={false}
          allowFullscreen={false}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
