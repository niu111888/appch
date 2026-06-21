import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadJP } from "@remotion/google-fonts/NotoSansJP";

const { fontFamily: jpFont } = loadJP("normal", { weights: ["500", "700"] });

type Cand = { style: string; svg: string };

/** 包くん候補を横一列に並べて比較するためのギャラリー（静止画書き出し用）。 */
export const MascotGallery: React.FC<{ candidates?: Cand[] }> = ({ candidates = [] }) => {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg,#FBF4E6,#F2E2C2)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 22,
        padding: 28,
        fontFamily: jpFont,
      }}
    >
      {candidates.map((c, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 264,
              height: 264,
              borderRadius: 28,
              background: "#ffffff",
              border: "1px solid #E0B97E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 16px 36px -18px rgba(110,50,25,0.35)",
            }}
          >
            <svg viewBox="0 0 100 100" width={224} height={224} dangerouslySetInnerHTML={{ __html: c.svg }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#8E2A3A" }}>
            {i + 1}. {c.style}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
