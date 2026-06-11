"use client";

import { useEffect, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";

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
  loop?: boolean;
  playerKey?: string | number;
};

export function RemotionEmbed<T extends Record<string, unknown>>({
  component,
  durationInFrames,
  fps = 30,
  width,
  height,
  inputProps,
  className = "",
  loop = true,
  playerKey,
}: RemotionEmbedProps<T>) {
  const [mounted, setMounted] = useState(false);

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

  return (
    <div className={className} style={{ width, height, maxWidth: "100%" }}>
      <Player
        key={playerKey}
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
    </div>
  );
}
