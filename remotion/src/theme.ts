import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const inter = loadInter("normal", {
  weights: ["400", "600", "700", "800", "900"],
  subsets: ["latin"],
}).fontFamily;

export const mono = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
}).fontFamily;

export const colors = {
  bg: "#070d1c",
  bgSoft: "#0e1a33",
  panel: "#111f3d",
  ink: "#f5f8ff",
  inkDim: "#8ea3c9",
  primary: "#3B82F6",
  primaryBright: "#60a5fa",
  warning: "#F5B301",
  urgent: "#ef4444",
  success: "#10b981",
};
