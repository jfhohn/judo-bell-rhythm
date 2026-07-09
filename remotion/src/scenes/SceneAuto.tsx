import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { colors, inter, mono } from "../theme";

// Scene 3: Automatic transitions & bells
export const SceneAuto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({ frame, fps, config: { damping: 200 } });

  // Bell pulse rings
  const pulse = (delay: number) => {
    const t = (frame - delay) % 60;
    if (t < 0) return { s: 0, o: 0 };
    return {
      s: interpolate(t, [0, 60], [0.3, 2.2]),
      o: interpolate(t, [0, 60], [0.9, 0]),
    };
  };

  const rings = [pulse(0), pulse(20), pulse(40)];

  return (
    <AbsoluteFill style={{ fontFamily: inter, color: colors.ink }}>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 200,
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * 20}px)`,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: colors.primaryBright, fontWeight: 700 }}>
          ZERO INTERVENTION
        </div>
        <div style={{ fontSize: 108, fontWeight: 900, marginTop: 16, letterSpacing: -3, lineHeight: 1.05 }}>
          Sections change<br />on their own.
        </div>
        <div style={{ fontSize: 34, color: colors.inkDim, marginTop: 28, maxWidth: 780, lineHeight: 1.4 }}>
          The bell rings. The next section loads. You keep teaching.
        </div>
      </div>

      {/* Bell icon with pulse rings */}
      <div
        style={{
          position: "absolute",
          right: 240,
          top: 380,
          width: 320,
          height: 320,
        }}
      >
        {rings.map((r, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `4px solid ${colors.primaryBright}`,
              transform: `scale(${r.s})`,
              opacity: r.o,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            inset: 40,
            borderRadius: "50%",
            background: `linear-gradient(180deg, ${colors.primaryBright}, ${colors.primary})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 120px ${colors.primary}aa`,
          }}
        >
          <svg width="140" height="140" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3a1.5 1.5 0 0 0-1.5 1.5v.6A6 6 0 0 0 6 11v3.2l-1.7 2.2a1 1 0 0 0 .8 1.6h13.8a1 1 0 0 0 .8-1.6L18 14.2V11a6 6 0 0 0-4.5-5.9v-.6A1.5 1.5 0 0 0 12 3Zm-2 17a2 2 0 1 0 4 0h-4Z"
              fill="#ffffff"
            />
          </svg>
        </div>

      </div>

      {/* Progress bar for current section */}
      <div style={{ position: "absolute", left: 140, bottom: 160, width: 900 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 26, color: colors.inkDim, letterSpacing: 3, fontWeight: 600 }}>
            NEWAZA · IN PROGRESS
          </div>
          <div style={{ fontFamily: mono, fontSize: 26, color: colors.ink, fontWeight: 500 }}>
            {`${Math.floor(interpolate(frame, [0, 150], [0, 82]))}%`}
          </div>
        </div>
        <div style={{ height: 18, background: colors.panel, borderRadius: 9, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${interpolate(frame, [0, 150], [0, 82], { extrapolateRight: "clamp" })}%`,
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryBright})`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
