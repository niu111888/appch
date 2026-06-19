import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadSC } from "@remotion/google-fonts/NotoSansSC";

const { fontFamily: scFont } = loadSC("normal", { weights: ["700"] });

/** iOS AppIcon 用（1024x1024）。えんじ背景＋うっすら中＋包くん。iOSが角丸にする前提でフルブリード。 */
export const AppIcon: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "radial-gradient(circle at 50% 42%, #A23347 0%, #8E2A3A 55%, #7E1F30 100%)",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* うっすら散らした「中」 */}
      <div style={{ position: "absolute", inset: 0, fontFamily: scFont, color: "#F4E3C2", fontWeight: 700 }}>
        <span style={{ position: "absolute", left: 110, top: 150, fontSize: 150, opacity: 0.1 }}>中</span>
        <span style={{ position: "absolute", right: 110, top: 150, fontSize: 150, opacity: 0.1 }}>中</span>
        <span style={{ position: "absolute", left: 140, bottom: 170, fontSize: 150, opacity: 0.1 }}>中</span>
        <span style={{ position: "absolute", right: 140, bottom: 170, fontSize: 150, opacity: 0.1 }}>中</span>
      </div>

      {/* やわらかいハイライト */}
      <div style={{ position: "absolute", width: 780, height: 780, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,240,220,0.16), rgba(255,240,220,0))" }} />

      {/* 包くん */}
      <svg width="660" height="660" viewBox="0 0 100 100" style={{ marginTop: 26 }}>
        <g transform="rotate(13 50 16)">
          <path d="M36 23 Q50 3 64 23 Q50 17 36 23 Z" fill="#443a63" />
          <path d="M34 21 Q50 27 66 21 L65 26 Q50 32 35 26 Z" fill="#574b7e" />
          <circle cx="50" cy="6" r="3.6" fill="#9486be" />
        </g>
        <path d="M50 25 C39 30 23 41 21 59 C19 79 34 89 50 89 C66 89 81 79 79 59 C77 41 61 30 50 25 Z" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.6" />
        <g stroke="#E4D2AE" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M50 28 Q36 36 30 50" />
          <path d="M50 28 Q44 38 42 52" />
          <path d="M50 28 Q50 40 50 53" />
          <path d="M50 28 Q56 38 58 52" />
          <path d="M50 28 Q64 36 70 50" />
        </g>
        <ellipse cx="50" cy="27" rx="6" ry="4.5" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.3" />
        <ellipse cx="19" cy="69" rx="6.5" ry="4.6" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.2" transform="rotate(-25 19 69)" />
        <ellipse cx="81" cy="69" rx="6.5" ry="4.6" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.2" transform="rotate(25 81 69)" />
        <circle cx="31" cy="62" r="6" fill="#F4A6B6" opacity="0.85" />
        <circle cx="69" cy="62" r="6" fill="#F4A6B6" opacity="0.85" />
        <path d="M36 57 Q41 51 46 57" stroke="#6B4A3A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M54 57 Q59 51 64 57" stroke="#6B4A3A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M42 62 Q50 75 58 62 Z" fill="#B05446" />
        <path d="M46 66 Q50 71 54 66 Z" fill="#F2999A" />
      </svg>
    </AbsoluteFill>
  );
};
