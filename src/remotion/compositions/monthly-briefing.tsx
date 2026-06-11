import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LIFEOS } from "../theme";

export type MonthlyBriefingProps = {
  monthLabel: string;
  lifeScore: number;
  topWin: string;
  topRisk: string;
  opportunity: string;
};

export function MonthlyBriefing({
  monthLabel,
  lifeScore,
  topWin,
  topRisk,
  opportunity,
}: MonthlyBriefingProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const ringProgress = interpolate(frame, [0, fps * 1.5], [0, lifeScore / 100], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const r = 56;
  const circ = 2 * Math.PI * r;
  const offset = circ - ringProgress * circ;

  const sections = [
    { label: "أبرز إنجاز", text: topWin, color: LIFEOS.emerald },
    { label: "خطر", text: topRisk, color: "#c96b7a" },
    { label: "فرصة", text: opportunity, color: LIFEOS.sky },
  ];

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #151a24, ${LIFEOS.bg}, #1e2838)`,
        fontFamily: "system-ui, sans-serif",
        padding: 40,
        flexDirection: "row",
        display: "flex",
        gap: 32,
      }}
    >
      <div style={{ flex: "0 0 180px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={70} cy={70} r={r} fill="none" stroke={LIFEOS.border} strokeWidth={8} />
          <circle
            cx={70}
            cy={70}
            r={r}
            fill="none"
            stroke={LIFEOS.gold}
            strokeWidth={8}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div style={{ position: "absolute", textAlign: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: LIFEOS.gold2 }}>{lifeScore}</div>
          <div style={{ fontSize: 9, color: LIFEOS.text3, letterSpacing: 2 }}>LIFE SCORE</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: LIFEOS.text3, letterSpacing: 3 }}>EXECUTIVE BRIEFING</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: LIFEOS.gold2, marginBottom: 24 }}>{monthLabel}</div>
        {sections.map((s, i) => {
          const op = interpolate(frame, [fps * 0.3 + i * 10, fps * 0.6 + i * 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div key={s.label} style={{ opacity: op, marginBottom: 16, padding: 14, borderRadius: 10, background: `${LIFEOS.surface}99`, borderLeft: `3px solid ${s.color}` }}>
              <div style={{ fontSize: 10, color: LIFEOS.text3, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 13, color: LIFEOS.text, lineHeight: 1.4 }}>{s.text}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
