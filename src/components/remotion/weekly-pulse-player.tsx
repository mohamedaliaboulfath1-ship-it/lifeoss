"use client";

import { WeeklyPulse } from "@/remotion/compositions/weekly-pulse";
import { RemotionEmbed } from "./remotion-embed";

interface Props {
  habitPct: number;
  workoutPct: number;
  goalsPct: number;
  className?: string;
}

export function WeeklyPulsePlayer({
  habitPct,
  workoutPct,
  goalsPct,
  className = "",
}: Props) {
  return (
    <RemotionEmbed
      component={WeeklyPulse}
      durationInFrames={75}
      width={360}
      height={140}
      inputProps={{ habitPct, workoutPct, goalsPct }}
      loop
      playerKey={`${habitPct}-${workoutPct}-${goalsPct}`}
      className={className}
    />
  );
}
