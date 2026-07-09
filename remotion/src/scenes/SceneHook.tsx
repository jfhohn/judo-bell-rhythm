import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { colors, inter } from "../theme";

// Scene 1: Hook — "Teaching judo, not watching the clock."
export const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const line1 = spring({ frame: frame - 6, fps, config: { damping: 200 } });
  const line2 = spring({ frame: frame - 26, fps, config: { damping: 200 } });
  const line3 = spring({ frame: frame - 52, fps, config: { damping: 14, stiffness: 90 } });

  const lift = interpolate(frame, [0, 120], [0, -20]);

  return (
    <AbsoluteFill style={{ fontFamily: inter, color: colors.ink }}>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 340,
          transform: `translateY(${lift}px)`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 8,
            color: colors.primaryBright,
            fontWeight: 700,
            opacity: line1,
            transform: `translateX(${(1 - line1) * -40}px)`,
          }}
        >
          SILICON VALLEY JUDO · SCHOOLBELL
        </div>
        <div
          style={{
            fontSize: 132,
            fontWeight: 800,
            lineHeight: 1.02,
            marginTop: 24,
            letterSpacing: -3,
            opacity: line2,
            transform: `translateX(${(1 - line2) * -60}px)`,
          }}
        >
          Teach judo.
        </div>
        <div
          style={{
            fontSize: 132,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: -3,
            opacity: line3,
            transform: `translateX(${(1 - line3) * -80}px)`,
          }}
        >
          Not the <span style={{ color: colors.primaryBright }}>clock</span>.
        </div>
      </div>

      {/* accent line */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 780,
          height: 6,
          width: interpolate(frame, [30, 110], [0, 520], { extrapolateRight: "clamp" }),
          background: `linear-gradient(90deg, ${colors.primaryBright}, transparent)`,
          borderRadius: 3,
        }}
      />
    </AbsoluteFill>
  );
};
