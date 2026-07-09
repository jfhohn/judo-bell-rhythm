import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { colors, inter } from "../theme";

// Scene 5: Close — Offline-first + tagline
export const SceneClose: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t1 = spring({ frame, fps, config: { damping: 200 } });
  const t2 = spring({ frame: frame - 22, fps, config: { damping: 14, stiffness: 90 } });
  const t3 = spring({ frame: frame - 40, fps, config: { damping: 200 } });

  const chips = [
    "Offline-first",
    "12-hour clock",
    "Multiple schedules",
    "Custom bells",
    "Distance-readable",
  ];

  return (
    <AbsoluteFill
      style={{
        fontFamily: inter,
        color: colors.ink,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 26,
          letterSpacing: 10,
          color: colors.primaryBright,
          fontWeight: 700,
          opacity: t1,
          transform: `translateY(${(1 - t1) * 20}px)`,
        }}
      >
        JUDO SCHOOLBELL
      </div>

      <div
        style={{
          fontSize: 160,
          fontWeight: 900,
          letterSpacing: -5,
          marginTop: 24,
          lineHeight: 1,
          textAlign: "center",
          opacity: t2,
          transform: `translateY(${(1 - t2) * 30}px) scale(${0.94 + t2 * 0.06})`,
        }}
      >
        Class flows.
      </div>
      <div
        style={{
          fontSize: 42,
          color: colors.inkDim,
          marginTop: 36,
          opacity: interpolate(frame, [30, 70], [0, 1], { extrapolateRight: "clamp" }),
          textAlign: "center",
          maxWidth: 1000,
        }}
      >
        Built for Silicon Valley Judo. Runs on any tablet, any laptop.
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          marginTop: 64,
          opacity: t3,
          transform: `translateY(${(1 - t3) * 20}px)`,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1400,
        }}
      >
        {chips.map((c, i) => {
          const chipIn = spring({ frame: frame - 40 - i * 5, fps, config: { damping: 200 } });
          return (
            <div
              key={c}
              style={{
                padding: "18px 32px",
                borderRadius: 999,
                border: `2px solid ${colors.primary}88`,
                background: `${colors.primary}22`,
                fontSize: 28,
                fontWeight: 600,
                opacity: chipIn,
                transform: `translateY(${(1 - chipIn) * 12}px)`,
              }}
            >
              {c}
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 70,
          height: 4,
          width: interpolate(frame, [40, 130], [0, 800], { extrapolateRight: "clamp" }),
          background: `linear-gradient(90deg, transparent, ${colors.primaryBright}, transparent)`,
        }}
      />
    </AbsoluteFill>
  );
};
