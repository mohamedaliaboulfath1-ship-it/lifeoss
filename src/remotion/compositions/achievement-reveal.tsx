import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LIFEOS } from "../theme";

export type AchievementRevealProps = {
  emoji: string;
  title: string;
  kind: string;
};

const KIND_COLORS: Record<string, string> = {
  goal: LIFEOS.gold,
  habit: LIFEOS.emerald,
  task: LIFEOS.sky,
  weight: LIFEOS.emerald2,
  finance: LIFEOS.gold,
  learning: LIFEOS.sky2,
  streak: "#f97316",
};

export function AchievementReveal({ emoji, title, kind }: AchievementRevealProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = KIND_COLORS[kind] ?? LIFEOS.gold;

  const scale = interpolate(frame, [0, fps * 0.35, fps * 0.6], [0.6, 1.15, 1], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const glow = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame, [fps * 1.2, fps * 1.5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        opacity,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: "center",
          padding: 32,
          borderRadius: 20,
          background: `linear-gradient(145deg, ${LIFEOS.surface}ee, ${LIFEOS.bg}ee)`,
          border: `1px solid ${color}55`,
          boxShadow: `0 0 ${40 * glow}px ${color}44`,
        }}
      >
        <div style={{ fontSize: 56, marginBottom: 12 }}>{emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: LIFEOS.gold }}>{title}</div>
      </div>
    </AbsoluteFill>
  );
}
