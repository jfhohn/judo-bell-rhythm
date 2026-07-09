import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  // Slow drifting radial gradient
  const x = interpolate(frame, [0, 640], [30, 70]);
  const y = interpolate(frame, [0, 640], [40, 60]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 900px at ${x}% ${y}%, ${colors.bgSoft} 0%, ${colors.bg} 55%, #03060f 100%)`,
      }}
    >
      {/* subtle grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(96,165,250,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage:
            "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
    </AbsoluteFill>
  );
};
