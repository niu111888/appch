import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * パンダのマスコット。ゆっくり上下に揺れ、イージングのかかった瞬きをし、
 * 接地影と手で生命感を出す。reactFrame を渡すとその時刻に一度だけホップする。
 * size は描画ピクセル幅。中身は 100x100 のviewBoxを拡大して使う。
 */
export const Mascot: React.FC<{ size?: number; reactFrame?: number | null }> = ({ size = 340, reactFrame = null }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ふわっと上下に揺れる
  const bob = Math.sin((frame / fps) * Math.PI * 2 * 0.55) * 10;
  // 少しだけ傾く
  const tilt = Math.sin((frame / fps) * Math.PI * 2 * 0.27) * 2.5;

  // 瞬き：台形イージング（パチッではなく自然に）
  const blinkPeriod = Math.round(fps * 2.6);
  const bl = frame % blinkPeriod;
  const eyeScaleY = bl < 6 ? interpolate(bl, [0, 2, 4, 6], [1, 0.1, 0.1, 1]) : 1;

  // 登場ホップ（reactFrame で一度だけ山型に弾む）
  let hopScale = 1;
  if (reactFrame != null && frame >= reactFrame) {
    const hop = spring({ frame: frame - reactFrame, fps, config: { damping: 9, stiffness: 200 } });
    hopScale = 1 + 0.06 * Math.sin(hop * Math.PI);
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `translateY(${bob}px) rotate(${tilt}deg) scale(${hopScale})`,
        transformOrigin: "center bottom",
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* 接地影（揺れの逆相で接地感） */}
        <ellipse cx="50" cy="95" rx="28" ry="4" fill="#7A2A4A" opacity="0.10" transform={`scale(${1 - bob / 220})`} style={{ transformOrigin: "50px 95px" }} />
        {/* 手（顔の下、bob逆位相で上下） */}
        <g transform={`translate(0 ${-bob * 0.4})`}>
          <ellipse cx="33" cy="84" rx="7" ry="9" fill="#ffffff" stroke="#EAD7DE" strokeWidth="1.2" />
          <ellipse cx="67" cy="84" rx="7" ry="9" fill="#ffffff" stroke="#EAD7DE" strokeWidth="1.2" />
        </g>
        {/* 耳 */}
        <circle cx="26" cy="20" r="14" fill="#2C2C2A" />
        <circle cx="74" cy="20" r="14" fill="#2C2C2A" />
        <circle cx="26" cy="20" r="6.5" fill="#5F5E5A" />
        <circle cx="74" cy="20" r="6.5" fill="#5F5E5A" />
        {/* 顔 */}
        <circle cx="50" cy="53" r="36" fill="#ffffff" stroke="#EAD7DE" strokeWidth="1.2" />
        {/* 目のパッチ（黒い隈） */}
        <g style={{ transform: `scaleY(${eyeScaleY})`, transformOrigin: "50px 50px" }}>
          <ellipse cx="35" cy="49" rx="10" ry="12.5" fill="#2C2C2A" />
          <ellipse cx="65" cy="49" rx="10" ry="12.5" fill="#2C2C2A" />
          {/* 瞳 */}
          <circle cx="37" cy="50" r="4" fill="#ffffff" />
          <circle cx="67" cy="50" r="4" fill="#ffffff" />
          <circle cx="36.2" cy="49.2" r="1.4" fill="#2C2C2A" />
          <circle cx="66.2" cy="49.2" r="1.4" fill="#2C2C2A" />
        </g>
        {/* ほっぺ */}
        <circle cx="24" cy="62" r="5.5" fill="#F4C0D1" opacity="0.85" />
        <circle cx="76" cy="62" r="5.5" fill="#F4C0D1" opacity="0.85" />
        {/* 鼻と口 */}
        <ellipse cx="50" cy="64" rx="5.5" ry="3.8" fill="#2C2C2A" />
        <path d="M50 67 Q43 74 37 70" stroke="#2C2C2A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M50 67 Q57 74 63 70" stroke="#2C2C2A" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
};
