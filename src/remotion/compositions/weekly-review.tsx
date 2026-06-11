import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LIFEOS } from "../theme";

export type WeeklyReviewProps = {
  weekLabel: string;
  habitsPct: number;
  workouts: number;
  goalsDone: number;
  learningHours: number;
  lifeScore: number;
};

export function WeeklyReview({
  weekLabel,
  habitsPct,
  workouts,
  goalsDone,
  learningHours,
  lifeScore,
}: WeeklyReviewProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.6], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const stats = [
    { label: "العادات", value: `${habitsPct}%`, color: LIFEOS.emerald },
    { label: "تمارين", value: String(workouts), color: LIFEOS.sky },
    { label: "أهداف", value: String(goalsDone), color: LIFEOS.gold },
    { label: "تعلم", value: `${learningHours}س`, color: LIFEOS.emerald2 },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${LIFEOS.bg} 0%, #1a2030 50%, ${LIFEOS.surface} 100%)`,
        fontFamily: "system-ui, sans-serif",
        padding: 48,
      }}
    >
      <div style={{ opacity: titleOpacity }}>
        <div style={{ fontSize: 12, color: LIFEOS.text3, letterSpacing: 4, marginBottom: 8 }}>
          WEEKLY REVIEW
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: LIFEOS.gold2, marginBottom: 6 }}>
          {weekLabel}
        </div>
        <div style={{ fontSize: 14, color: LIFEOS.text3 }}>ملخص أسبوعك في LifeOS</div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginTop: 40,
        }}
      >
        {stats.map((s, i) => {
          const delay = i * 8;
          const op = interpolate(frame, [delay, delay + fps * 0.5], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const y = interpolate(frame, [delay, delay + fps * 0.5], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <div
              key={s.label}
              style={{
                opacity: op,
                transform: `translateY(${y}px)`,
                padding: 20,
                borderRadius: 12,
                background: `${LIFEOS.surface}cc`,
                border: `1px solid ${LIFEOS.border}`,
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: LIFEOS.text3, marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 48,
          right: 48,
          opacity: interpolate(
            frame,
            [durationInFrames * 0.5, durationInFrames * 0.7],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
        }}
      >
        <div style={{ fontSize: 11, color: LIFEOS.text3 }}>Life Score</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: LIFEOS.gold2 }}>{lifeScore}</div>
      </div>
    </AbsoluteFill>
  );
}
