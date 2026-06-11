"use client";

import { LifeScoreOrb } from "@/remotion/compositions/life-score-orb";
import { RemotionEmbed } from "./remotion-embed";

interface Props {
  score: number;
  size?: number;
  pulseKey?: number;
}

export function LifeScoreOrbPlayer({ score, size = 96, pulseKey = 0 }: Props) {
  const scale = size / 200;

  return (
    <div
      className="shrink-0 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div
        style={{
          width: 200,
          height: 200,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <RemotionEmbed
          component={LifeScoreOrb}
          durationInFrames={90}
          width={200}
          height={200}
          inputProps={{ score }}
          playerKey={`${score}-${pulseKey}`}
          playOnView={false}
        />
      </div>
    </div>
  );
}
