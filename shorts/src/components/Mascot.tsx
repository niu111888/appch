import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * パンダのマスコット。ゆっくり上下に揺れて、ときどき瞬きする。
 * size は描画ピクセル幅。中身は 100x100 のviewBoxを拡大して使う。
 */
export const Mascot: React.FC<{ size?: number }> = ({ size = 320 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ふわっと上下に揺れる
  const bob = Math.sin((frame / fps) * Math.PI * 2 * 0.55) * 10;
  // 少しだけ傾く
  const tilt = Math.sin((frame / fps) * Math.PI * 2 * 0.27) * 2.5;

  // 約2.6秒ごとに瞬き（4フレームだけ目を閉じる）
  const blinkPeriod = Math.round(fps * 2.6);
  const isBlink = frame % blinkPeriod < 4;
  const eyeScaleY = isBlink ? 0.12 : 1;

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `translateY(${bob}px) rotate(${tilt}deg)`,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        {/* 耳 */}
        <circle cx="26" cy="20" r="14" fill="#2C2C2A" />
        <circle cx="74" cy="20" r="14" fill="#2C2C2A" />
        <circle cx="26" cy="20" r="6.5" fill="#5F5E5A" />
        <circle cx="74" cy="20" r="6.5" fill="#5F5E5A" />
        {/* 顔 */}
        <circle cx="50" cy="53" r="36" fill="#ffffff" stroke="#E4E2DA" strokeWidth="1" />
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
