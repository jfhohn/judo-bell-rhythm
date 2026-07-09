import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { colors, inter, mono } from "../theme";

// Scene 4: Visual warnings — 5min yellow, 2min red
export const SceneWarnings: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1 (0-75): yellow, 5:00 countdown. Phase 2 (75-150): red, 2:00 countdown pulsing.
  const yellowPhase = frame < 75;
  const flashT = ((frame - 75) % 20) / 20;
  const redFlash = yellowPhase ? 0 : Math.sin(flashT * Math.PI);

  const bgTint = yellowPhase
    ? `radial-gradient(1200px 800px at 50% 60%, ${colors.warning}22, transparent 70%)`
    : `radial-gradient(1200px 800px at 50% 60%, ${colors.urgent}${Math.floor(20 + redFlash * 60).toString(16)}, transparent 70%)`;

  const seconds = yellowPhase
    ? 300 - Math.floor(interpolate(frame, [0, 75], [0, 20]))
    : 120 - Math.floor(interpolate(frame - 75, [0, 75], [0, 40]));
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;
  const timeStr = `${mm}:${String(ss).padStart(2, "0")}`;

  const cardIn = spring({ frame, fps, config: { damping: 200 } });
  const redIn = spring({ frame: frame - 75, fps, config: { damping: 15, stiffness: 120 } });

  const activeColor = yellowPhase ? colors.warning : colors.urgent;

  return (
    <AbsoluteFill style={{ fontFamily: inter, color: colors.ink }}>
      <div style={{ position: "absolute", inset: 0, background: bgTint }} />

      <div
        style={{
          position: "absolute",
          left: 140,
          top: 180,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 20}px)`,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: activeColor, fontWeight: 700 }}>
          VISIBLE FROM ACROSS THE MAT
        </div>
        <div style={{ fontSize: 96, fontWeight: 900, marginTop: 16, letterSpacing: -2, lineHeight: 1.05 }}>
          Warnings you<br />can't miss.
        </div>
      </div>

      {/* Two badges: 5:00 yellow, 2:00 red */}
      <div style={{ position: "absolute", left: 140, bottom: 200, display: "flex", gap: 40 }}>
        <div
          style={{
            padding: "32px 44px",
            borderRadius: 24,
            background: yellowPhase ? colors.warning : "#3a2f0a",
            color: yellowPhase ? "#1a1200" : colors.warning,
            border: `2px solid ${colors.warning}`,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 2,
            transform: `scale(${yellowPhase ? 1 : 0.92})`,
            opacity: yellowPhase ? 1 : 0.7,
          }}
        >
          5:00 · VISUAL
        </div>
        <div
          style={{
            padding: "32px 44px",
            borderRadius: 24,
            background: yellowPhase ? "#2a0a0a" : colors.urgent,
            color: yellowPhase ? colors.urgent : colors.ink,
            border: `2px solid ${colors.urgent}`,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: 2,
            transform: `scale(${yellowPhase ? 0.92 : 1 + redFlash * 0.05})`,
            opacity: yellowPhase ? 0.6 : 1,
            boxShadow: yellowPhase ? "none" : `0 0 60px ${colors.urgent}cc`,
          }}
        >
          2:00 · VISUAL + BELL
        </div>
      </div>

      {/* Countdown big display */}
      <div
        style={{
          position: "absolute",
          right: 180,
          top: 320,
          padding: 48,
          borderRadius: 32,
          border: `4px solid ${activeColor}`,
          background: yellowPhase ? `${colors.warning}18` : `${colors.urgent}${Math.floor(20 + redFlash * 40).toString(16)}`,
          textAlign: "center",
          transform: `scale(${yellowPhase ? 1 : 1 + redFlash * 0.03}) ${!yellowPhase ? `scale(${0.9 + redIn * 0.1})` : ""}`,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, color: activeColor, fontWeight: 700 }}>
          {yellowPhase ? "5 MIN WARNING" : "FINAL 2 MINUTES"}
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 300,
            fontWeight: 700,
            lineHeight: 1,
            marginTop: 8,
            color: activeColor,
            letterSpacing: -6,
            textShadow: `0 0 40px ${activeColor}aa`,
          }}
        >
          {timeStr}
        </div>
      </div>
    </AbsoluteFill>
  );
};
