import { AbsoluteFill, useCurrentFrame, spring, interpolate, useVideoConfig } from "remotion";
import { colors, inter, mono } from "../theme";

// Scene 2: Big clock + schedule sections
export const SceneClock: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const clockIn = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const listIn = spring({ frame: frame - 20, fps, config: { damping: 200 } });

  // Advancing time 6:00 PM → 6:07 PM over scene
  const seconds = Math.floor(interpolate(frame, [0, 150], [0, 420]));
  const minutes = 0 + Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeStr = `6:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")} PM`;

  const sections = [
    { name: "Warm-up", dur: "0:15", active: seconds < 60 },
    { name: "Ukemi", dur: "0:10", active: seconds >= 60 && seconds < 180 },
    { name: "Newaza", dur: "0:20", active: seconds >= 180 && seconds < 300 },
    { name: "Tachiwaza", dur: "0:20", active: seconds >= 300 && seconds < 420 },
    { name: "Randori", dur: "0:15", active: seconds >= 420 },
  ];

  return (
    <AbsoluteFill style={{ fontFamily: inter, color: colors.ink, padding: 100 }}>
      {/* Big clock */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 220,
          transform: `scale(${0.9 + clockIn * 0.1})`,
          transformOrigin: "left center",
          opacity: clockIn,
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, color: colors.inkDim, fontWeight: 600 }}>
          CURRENT TIME
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 240,
            fontWeight: 700,
            lineHeight: 1,
            marginTop: 12,
            color: colors.ink,
            textShadow: `0 0 60px ${colors.primary}88`,
            letterSpacing: -4,
          }}
        >
          {timeStr}
        </div>
        <div style={{ fontSize: 32, marginTop: 12, color: colors.primaryBright, fontWeight: 600 }}>
          Tuesday · Standard Class
        </div>
      </div>

      {/* Schedule list */}
      <div
        style={{
          position: "absolute",
          right: 100,
          top: 180,
          width: 560,
          opacity: listIn,
          transform: `translateX(${(1 - listIn) * 60}px)`,
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 6, color: colors.inkDim, fontWeight: 600, marginBottom: 24 }}>
          TONIGHT'S SCHEDULE
        </div>
        {sections.map((s, i) => {
          const rowIn = spring({ frame: frame - 24 - i * 6, fps, config: { damping: 200 } });
          const active = s.active;
          return (
            <div
              key={s.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "22px 28px",
                marginBottom: 12,
                borderRadius: 16,
                background: active ? colors.primary : colors.panel,
                border: `1px solid ${active ? colors.primaryBright : "#1e2a4d"}`,
                opacity: rowIn,
                transform: `translateY(${(1 - rowIn) * 20}px) scale(${active ? 1.03 : 1})`,
                boxShadow: active ? `0 20px 60px ${colors.primary}66` : "none",
                transition: "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: active ? colors.ink : colors.inkDim,
                  }}
                />
                <div style={{ fontSize: 38, fontWeight: 700 }}>{s.name}</div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 32, fontWeight: 500, opacity: 0.9 }}>
                {s.dur}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
