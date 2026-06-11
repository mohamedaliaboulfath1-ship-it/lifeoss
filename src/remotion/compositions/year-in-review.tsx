import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LIFEOS } from "../theme";

export type YearInReviewProps = {
  year: string;
  habitsCompleted: number;
  booksRead: number;
  weightDelta: number;
  learningHours: number;
  savingsTotal: number;
  lifeScore: number;
};

export function YearInReview({
  year,
  habitsCompleted,
  booksRead,
  weightDelta,
  learningHours,
  savingsTotal,
  lifeScore,
}: YearInReviewProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const milestones = [
    { emoji: "🔄", value: habitsCompleted, label: "عادة مكتملة" },
    { emoji: "📚", value: booksRead, label: "كتاب" },
    { emoji: "⚖️", value: `${weightDelta > 0 ? "+" : ""}${weightDelta}كجم`, label: "تحول جسدي" },
    { emoji: "🧠", value: `${learningHours}س`, label: "تعلم" },
    { emoji: "💰", value: savingsTotal, label: "ادّخار" },
  ];

  const heroOpacity = interpolate(frame, [0, fps], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 20%, rgba(201,164,92,0.15), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(91,143,201,0.12), transparent 45%), ${LIFEOS.bg}`,
        fontFamily: "system-ui, sans-serif",
        padding: 40,
      }}
    >
      <div style={{ opacity: heroOpacity, textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: LIFEOS.text3, letterSpacing: 6 }}>YEAR IN REVIEW</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: LIFEOS.gold2, marginTop: 8 }}>{year}</div>
        <div style={{ fontSize: 14, color: LIFEOS.text3, marginTop: 8 }}>رحلتك مع LifeOS</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {milestones.map((m, i) => {
          const start = fps * 0.4 + i * 6;
          const scale = interpolate(frame, [start, start + 12], [0.6, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.back(1.5)),
          });
          const op = interpolate(frame, [start, start + 8], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={m.label}
              style={{
                opacity: op,
                transform: `scale(${scale})`,
                width: 140,
                padding: 16,
                borderRadius: 14,
                background: `${LIFEOS.surface}dd`,
                border: `1px solid ${LIFEOS.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28 }}>{m.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: LIFEOS.gold2, marginTop: 6 }}>
                {m.value}
              </div>
              <div style={{ fontSize: 10, color: LIFEOS.text3 }}>{m.label}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(
            frame,
            [durationInFrames * 0.65, durationInFrames * 0.85],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          ),
        }}
      >
        <div style={{ fontSize: 12, color: LIFEOS.text3 }}>Life Score النهائي</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: LIFEOS.gold2 }}>{lifeScore}</div>
      </div>
    </AbsoluteFill>
  );
}
