import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { LIFEOS } from "../theme";

const ORBS = [
  { x: 0.15, y: 0.3, size: 180, color: LIFEOS.gold, speed: 0.4 },
  { x: 0.75, y: 0.55, size: 220, color: LIFEOS.sky, speed: 0.55 },
  { x: 0.45, y: 0.15, size: 140, color: LIFEOS.emerald, speed: 0.35 },
] as const;

export function AmbientHero() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const loop = fps * 8;

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent", overflow: "hidden" }}>
      {ORBS.map((orb, i) => {
        const t = (frame + i * 20) % loop;
        const driftX = interpolate(
          t,
          [0, loop / 2, loop],
          [-12, 12, -12],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const driftY = interpolate(
          t,
          [0, loop / 3, (loop * 2) / 3, loop],
          [0, -18, 10, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const scale = interpolate(
          t,
          [0, loop / 2, loop],
          [0.85, 1.1, 0.85],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const opacity = interpolate(
          t,
          [0, loop / 2, loop],
          [0.12, 0.22, 0.12],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const hex = orb.color === LIFEOS.gold
          ? `rgba(201,164,92,${opacity})`
          : orb.color === LIFEOS.sky
            ? `rgba(91,143,201,${opacity})`
            : `rgba(74,158,130,${opacity})`;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.x * width + driftX - (orb.size * scale) / 2,
              top: orb.y * height + driftY - (orb.size * scale) / 2,
              width: orb.size * scale,
              height: orb.size * scale,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${hex} 0%, transparent 68%)`,
              filter: "blur(28px)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, transparent 0%, ${LIFEOS.gold}08 40%, ${LIFEOS.sky}06 100%)`,
        }}
      />
    </AbsoluteFill>
  );
}
