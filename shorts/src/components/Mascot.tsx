import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

/**
 * マスコット「包くん」(小籠包)。ふわふわ揺れ、ぷるんと弾み(squash)、接地影つき。
 * reactFrame を渡すとその時刻に一度だけホップする。
 * 中身は 100x100 のviewBoxを size に拡大して使う。
 */
export const Mascot: React.FC<{ size?: number; reactFrame?: number | null }> = ({ size = 340, reactFrame = null }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const bob = Math.sin(t * Math.PI * 2 * 0.55) * 10;
  const tilt = Math.sin(t * Math.PI * 2 * 0.27) * 2.2;
  // ぷるぷる弾み（横に伸びると縦に縮む＝小籠包の柔らかさ）
  const squash = Math.sin(t * Math.PI * 2 * 0.55) * 0.03;
  const sx = (1 + squash).toFixed(4);
  const sy = (1 - squash).toFixed(4);

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
        <ellipse cx="50" cy="95" rx="27" ry="3.8" fill="#7A2A1E" opacity="0.10" transform={`translate(50 95) scale(${(1 - bob / 220).toFixed(4)}) translate(-50 -95)`} />

        {/* 本体（squashで弾む。基準は底） */}
        <g transform={`translate(50 89) scale(${sx} ${sy}) translate(-50 -89)`}>
          {/* ニット帽 */}
          <g transform="rotate(13 50 16)">
            <path d="M36 23 Q50 3 64 23 Q50 17 36 23 Z" fill="#443a63" />
            <path d="M34 21 Q50 27 66 21 L65 26 Q50 32 35 26 Z" fill="#574b7e" />
            <circle cx="50" cy="6" r="3.6" fill="#9486be" />
          </g>
          {/* 小籠包の本体 */}
          <path d="M50 25 C39 30 23 41 21 59 C19 79 34 89 50 89 C66 89 81 79 79 59 C77 41 61 30 50 25 Z" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.6" />
          {/* ひだ */}
          <g stroke="#E4D2AE" strokeWidth="1.2" fill="none" strokeLinecap="round">
            <path d="M50 28 Q36 36 30 50" />
            <path d="M50 28 Q44 38 42 52" />
            <path d="M50 28 Q50 40 50 53" />
            <path d="M50 28 Q56 38 58 52" />
            <path d="M50 28 Q64 36 70 50" />
          </g>
          {/* 上のつまみ */}
          <ellipse cx="50" cy="27" rx="6" ry="4.5" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.3" />
          {/* 手 */}
          <ellipse cx="19" cy="69" rx="6.5" ry="4.6" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.2" transform="rotate(-25 19 69)" />
          <ellipse cx="81" cy="69" rx="6.5" ry="4.6" fill="#FBF3E3" stroke="#E4D2AE" strokeWidth="1.2" transform="rotate(25 81 69)" />
          {/* ほっぺ */}
          <circle cx="31" cy="62" r="6" fill="#F4A6B6" opacity="0.85" />
          <circle cx="69" cy="62" r="6" fill="#F4A6B6" opacity="0.85" />
          {/* えへへ目 */}
          <path d="M36 57 Q41 51 46 57" stroke="#6B4A3A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M54 57 Q59 51 64 57" stroke="#6B4A3A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          {/* 口 */}
          <path d="M42 62 Q50 75 58 62 Z" fill="#B05446" />
          <path d="M46 66 Q50 71 54 66 Z" fill="#F2999A" />
        </g>
      </svg>
    </div>
  );
};

void interpolate;
