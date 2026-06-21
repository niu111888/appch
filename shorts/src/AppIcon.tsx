import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";

/** iOS AppIcon 用（1024x1024）。裏・中国語のロゴ（3キャラ）を正方形にトリミング。 */
export const AppIcon: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#F4EEDE" }}>
      <Img src={staticFile("character/logo.png")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 36%", transform: "scale(1.25)" }} />
    </AbsoluteFill>
  );
};
