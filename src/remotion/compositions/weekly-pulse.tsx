import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LIFEOS } from "../theme";

export type WeeklyPulseProps = {
  habitPct: number;
  workoutPct: number;
  goalsPct: number;
};

const BARS = [
  { key: "habitPct" as const, label: "عادات", color: LIFEOS.emerald },
  { key: "workoutPct" as const, label: "تمارين", color: LIFEOS.sky },
  { key: "goalsPct" as const, label: "أهداف", color: LIFEOS.gold },
];

export function WeeklyPulse({ habitPct, workoutPct, goalsPct }: WeeklyPulseProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const values = { habitPct, workoutPct, goalsPct };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        padding: "12px 16px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-around",
          height: "100%",
          gap: 16,
        }}
      >
        {BARS.map((bar, i) => {
          const target = Math.min(100, values[bar.key]);
          const heightPct = interpolate(
            frame,
            [i * 6, i * 6 + fps * 0.8],
            [0, target],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }
          );
          const display = Math.round(
            interpolate(
              frame,
              [i * 6, i * 6 + fps * 0.8],
              [0, target],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          );

          return (
            <div
              key={bar.key}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: bar.color,
                  fontFamily: "ui-monospace, monospace",
                }}
              >
                {display}%
              </div>
              <div
                style={{
                  width: "100%",
                  height: 72,
                  background: `${LIFEOS.border}55`,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "flex-end",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    background: `linear-gradient(to top, ${bar.color}99, ${bar.color})`,
                    borderRadius: 6,
                    boxShadow: `0 0 12px ${bar.color}44`,
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: LIFEOS.text3 }}>{bar.label}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
