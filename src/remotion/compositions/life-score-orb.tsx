import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LIFEOS } from "../theme";

export type LifeScoreOrbProps = {
  score: number;
};

const R = 72;
const SIZE = 200;

export function LifeScoreOrb({ score }: LifeScoreOrbProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const circ = 2 * Math.PI * R;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  const progress = interpolate(frame, [0, fps * 1.4], [0, score / 100], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const displayScore = Math.round(
    interpolate(frame, [0, fps * 1.4], [0, score], {
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    })
  );

  const breathe = interpolate(
    frame % Math.round(fps * 2.5),
    [0, fps * 1.25, fps * 2.5],
    [0.92, 1.06, 0.92],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const glowOpacity = interpolate(
    frame % Math.round(fps * 2.5),
    [0, fps * 1.25, fps * 2.5],
    [0.18, 0.35, 0.18],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const offset = circ - progress * circ;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 160 * breathe,
          height: 160 * breathe,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(201,164,92,${glowOpacity}) 0%, rgba(91,143,201,${glowOpacity * 0.4}) 45%, transparent 72%)`,
        }}
      />
      <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={LIFEOS.border}
          strokeWidth={7}
        />
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={LIFEOS.gold}
          strokeWidth={7}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
        <circle
          cx={cx}
          cy={cy}
          r={R - 14}
          fill="none"
          stroke={LIFEOS.sky}
          strokeWidth={2}
          strokeDasharray={circ * 0.6}
          strokeDashoffset={circ * 0.3}
          opacity={0.35}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 38,
            fontWeight: 900,
            color: LIFEOS.gold2,
            lineHeight: 1,
          }}
        >
          {displayScore}
        </div>
        <div
          style={{
            fontSize: 9,
            color: LIFEOS.text3,
            letterSpacing: 3,
            marginTop: 4,
            textTransform: "uppercase",
          }}
        >
          Life Score
        </div>
      </div>
    </AbsoluteFill>
  );
}
