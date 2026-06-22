import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, interpolate, spring, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadJP } from "@remotion/google-fonts/NotoSansJP";
import { splitPinyin, colorOf } from "./tone.mjs";

const { fontFamily: scFont } = loadSC("normal", { weights: ["400", "500", "700"] });
const { fontFamily: jpFont } = loadJP("normal", { weights: ["400", "500", "700"] });

type Back = { hanzi: string; pinyin: string; meaning: string; example: string; exampleMeaning: string; tag?: string; audio: string; dur: number };
export type UraScene = {
  category: string;
  front: { hanzi: string; pinyin: string; meaning: string; audio: string; dur: number };
  backs: Back[];
  index?: number;
};

const C = {
  bg: "#F4EEDE",
  ink: "#5A4636",
  inkSoft: "#8C7A66",
  hanzi: "#4A3A2C",
  frontCard: "#E8E3D6",
  frontInk: "#9A9183",
  x: "#D6453F",
  accent: "#E07A8E",
  card: "#FFFDF6",
  line: "#E3C99B",
};

const T = { frontIn: 0.45, frontTail: 0.2, xHold: 1.05, uraGap: 0.1, intro: 0.5, backRead: 0.25, backTail: 0.8, outro: 1.9 };

function backWindows(s: UraScene, fps: number) {
  const s2f = (x: number) => Math.round(x * fps);
  const frontRead = s2f(T.frontIn);
  const frontEnd = frontRead + s2f(s.front.dur);
  const xStart = frontEnd + s2f(T.frontTail);
  const xEnd = xStart + s2f(T.xHold);
  const uraStart = xEnd + s2f(T.uraGap);
  let cursor = uraStart + s2f(T.intro);
  const wins = s.backs.map((b) => {
    const start = cursor;
    const readAt = start + s2f(T.backRead);
    const end = readAt + s2f(b.dur) + s2f(T.backTail);
    cursor = end;
    return { start, readAt, end };
  });
  const outroStart = cursor;
  return { frontRead, xStart, xEnd, uraStart, wins, outroStart, total: outroStart + s2f(T.outro) };
}

export function sceneToFramesUra(s: UraScene, fps: number): number {
  return backWindows(s, fps).total;
}

const FALLBACK: UraScene = {
  category: "称賛",
  front: { hanzi: "很厉害", pinyin: "hěn lì hai", meaning: "すごい", audio: "audio/u_front.mp3", dur: 1 },
  backs: [{ hanzi: "绝了", pinyin: "jué le", meaning: "神・ヤバい", example: "这家奶茶绝了！", exampleMeaning: "このタピオカ絶品！", audio: "audio/u_back0.mp3", dur: 1 }],
};

// カテゴリの気分に合わせた「裏」の登場キャラ（3つの裏カードに順に対応）
const DEFAULT_ROT = ["panda_excited", "rabbit_joy", "pig_hat"];
const CHAR_BY_CAT: Record<string, string[]> = {
  称賛: ["panda_excited", "rabbit_joy", "pig_hat"],
  驚き: ["rabbit_joy", "panda_excited", "pig_tired"],
  了解: ["panda_modern", "rabbit_fashion", "pig_hat"],
  恋愛: ["rabbit_fashion", "rabbit_joy", "panda_excited"],
  だるい: ["pig_tired", "panda_modern", "rabbit_fashion"],
  ありがとう: ["panda_excited", "rabbit_joy", "pig_hat"],
  グルメ: ["panda_modern", "pig_hat", "pig_art"],
  賛成: ["panda_excited", "pig_hat", "rabbit_joy"],
  笑える: ["rabbit_joy", "panda_excited", "pig_hat"],
  別れ: ["panda_modern", "rabbit_fashion", "pig_hat"],
  応援: ["panda_excited", "rabbit_joy", "pig_hat"],
  かわいい: ["rabbit_fashion", "pig_hat", "rabbit_joy"],
  // 新カテゴリ（職場/ピンチ/呆れ/布教/お金/ビジュ）
  "残業・激務": ["pig_tired", "panda_basic", "rabbit_read"],
  サボる: ["panda_modern", "rabbit_fashion", "pig_tired"],
  "社畜・打工人": ["pig_tired", "panda_studious", "rabbit_read"],
  "ヤバい(終わった)": ["pig_tired", "rabbit_joy", "panda_excited"],
  "やらかし・大失敗": ["pig_tired", "rabbit_joy", "panda_excited"],
  焦る: ["panda_excited", "pig_tired", "rabbit_joy"],
  "呆れる・無言": ["pig_tired", "panda_basic", "rabbit_read"],
  "布教・おすすめ": ["panda_excited", "rabbit_joy", "pig_hat"],
  "金欠・貧乏": ["pig_tired", "panda_modern", "rabbit_read"],
  "節約・お得": ["panda_modern", "rabbit_fashion", "pig_hat"],
  かっこいい: ["panda_modern", "rabbit_fashion", "panda_excited"],
  "美人・綺麗": ["rabbit_fashion", "rabbit_joy", "panda_modern"],
  "オシャレ・センス": ["rabbit_fashion", "panda_modern", "pig_art"],
  // ユーザー提供ネタ（感情/人間関係/罠/トレンド）
  ブチギレ: ["pig_tired", "panda_excited", "rabbit_joy"],
  "あきれ・お手上げ": ["pig_tired", "panda_basic", "rabbit_read"],
  "絶望・詰んだ": ["pig_tired", "rabbit_read", "panda_basic"],
  空気読めない: ["panda_basic", "rabbit_read", "pig_tired"],
  "陰キャ・陽キャ": ["rabbit_read", "pig_hat", "panda_excited"],
  "告白・好き": ["rabbit_fashion", "rabbit_joy", "panda_excited"],
  直訳厳禁の罠: ["panda_studious", "rabbit_read", "pig_art"],
  日本語と意味が違う罠: ["panda_studious", "pig_art", "rabbit_read"],
  "マウント・盛る": ["panda_modern", "rabbit_fashion", "panda_excited"],
};

const sizeFor = (hanzi: string, big = true) => {
  const n = [...hanzi].length;
  if (big) return n <= 2 ? 170 : n === 3 ? 140 : 116;
  return n <= 2 ? 150 : n === 3 ? 124 : 104;
};

const fadeWin = (frame: number, start: number, end: number, f: number) =>
  Math.min(
    interpolate(frame, [start, start + f], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [end - f, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

export const UraShort: React.FC<{ scene?: UraScene }> = ({ scene }) => {
  const s = scene ?? FALLBACK;
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const s2f = (x: number) => Math.round(x * fps);
  const W = backWindows(s, fps);
  const f = s2f(0.18);

  // 場面ごとの表情キャラ（表＝真面目パンダ / 裏＝カテゴリの気分に合わせて出し分け）
  const rot = CHAR_BY_CAT[s.category] ?? DEFAULT_ROT;
  let charSrc: string | null = null;
  let charAppear = 0;
  if (frame < W.xStart) {
    charSrc = "panda_studious";
  } else {
    const bi = W.wins.findIndex((w) => frame >= w.start && frame < w.end);
    if (bi >= 0) {
      charSrc = rot[bi % rot.length];
      charAppear = W.wins[bi].start;
    }
  }

  // 表→裏で背景色をふわっと切替（裏に入ると少し温かいクリームへ）
  const bgMix = interpolate(frame, [W.xEnd, W.uraStart + s2f(0.3)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bg = bgMix < 0.5 ? "#EEE9DA" : "#F7F0DD";

  return (
    <AbsoluteFill style={{ backgroundColor: bg, fontFamily: jpFont, overflow: "hidden" }}>
      {/* カテゴリ＆裏ラベル（裏セグメント中だけ・中央寄りで見やすく） */}
      {frame >= W.uraStart && frame < W.outroStart ? (
        <div style={{ position: "absolute", top: 360, width: "100%", display: "flex", justifyContent: "center", opacity: fadeWin(frame, W.uraStart, W.outroStart, f) }}>
          <div style={{ background: C.accent, color: "#fff", fontSize: 40, fontWeight: 700, padding: "12px 34px", borderRadius: 999, boxShadow: "0 10px 24px -10px rgba(180,80,100,0.5)" }}>裏：{s.category}のリアル</div>
        </div>
      ) : null}

      {/* 表（教科書・グレー） */}
      <Segment visible={frame < W.xStart} start={0} fadeOutAt={W.xStart} f={f}>
        <div style={{ width: "80%", left: "10%", position: "absolute", top: 540, background: C.frontCard, borderRadius: 44, padding: "48px 40px", textAlign: "center" }}>
          <div style={{ fontSize: 36, color: C.frontInk, fontWeight: 700, letterSpacing: 2 }}>教科書では…</div>
          <div style={{ fontFamily: scFont, fontSize: sizeFor(s.front.hanzi), fontWeight: 700, color: C.frontInk, marginTop: 16 }}>{s.front.hanzi}</div>
          <div style={{ fontFamily: scFont, fontSize: 56, color: "#B3AB9C", marginTop: 6 }}>{s.front.pinyin}</div>
          <div style={{ fontSize: 52, color: C.frontInk, marginTop: 16, fontWeight: 500 }}>{s.front.meaning}</div>
        </div>
      </Segment>

      {/* ❌（掴み） */}
      {frame >= W.xStart && frame < W.xEnd ? <CrossHit frame={frame} start={W.xStart} end={W.xEnd} fps={fps} /> : null}

      {/* 裏（リアル・ポップ＋声調カラー） */}
      {s.backs.map((b, i) => {
        const w = W.wins[i];
        if (frame < w.start || frame >= w.end) return null;
        const op = fadeWin(frame, w.start, w.end, f);
        const pe = spring({ frame: frame - w.start, fps, config: { damping: 13, stiffness: 170 }, durationInFrames: s2f(0.5) });
        const sc = interpolate(pe, [0, 1], [0.85, 1]);
        const speaking = frame >= w.readAt && frame < w.readAt + s2f(b.dur);
        return (
          <AbsoluteFill key={i} style={{ opacity: op }}>
            <div style={{ position: "absolute", top: 470, left: "10%", width: "80%", transform: `scale(${sc})`, transformOrigin: "center", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 10 }}>
                <span style={{ background: "#fff", color: C.accent, border: `2px solid ${C.accent}`, fontSize: 30, fontWeight: 700, padding: "4px 18px", borderRadius: 999 }}>{i + 1} / {s.backs.length}</span>
                {b.tag ? <span style={{ background: C.accent, color: "#fff", fontSize: 30, fontWeight: 700, padding: "4px 18px", borderRadius: 999 }}>{b.tag}</span> : null}
              </div>
              <div style={{ background: C.card, borderRadius: 44, padding: "40px 34px", boxShadow: "0 22px 50px -24px rgba(120,80,40,0.28)" }}>
                <div style={{ fontFamily: scFont, fontSize: sizeFor(b.hanzi), fontWeight: 700, color: C.hanzi, lineHeight: 1.1, transform: speaking ? "scale(1.04)" : "scale(1)" }}>{b.hanzi}</div>
                <div style={{ fontFamily: scFont, fontSize: 64, marginTop: 8 }}>
                  {splitPinyin(b.pinyin).map((syl, k, arr) => (
                    <span key={k} style={{ color: colorOf(syl), marginRight: k < arr.length - 1 ? 8 : 0 }}>{syl}</span>
                  ))}
                </div>
                <div style={{ fontSize: 56, color: C.ink, marginTop: 14, fontWeight: 700 }}>{b.meaning}</div>
                <div style={{ marginTop: 22, paddingTop: 18, borderTop: `2px solid ${C.line}` }}>
                  <div style={{ fontFamily: scFont, fontSize: 44, color: C.hanzi }}>{b.example}</div>
                  <div style={{ fontSize: 34, color: C.inkSoft, marginTop: 8 }}>{b.exampleMeaning}</div>
                </div>
              </div>
            </div>
          </AbsoluteFill>
        );
      })}

      {/* アウトロ（ロゴ＋アプリ誘導） */}
      {frame >= W.outroStart ? (
        <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center", opacity: interpolate(frame, [W.outroStart, W.outroStart + f], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <Img src={staticFile("character/logo.png")} style={{ width: 760, objectFit: "contain" }} />
          <div style={{ fontSize: 46, color: C.ink, fontWeight: 700, marginTop: 4 }}>教科書にないリアル中国語</div>
          <div style={{ marginTop: 28, background: C.x, color: "#fff", fontSize: 40, fontWeight: 700, padding: "18px 44px", borderRadius: 999 }}>プロフのURL → アプリで学ぶ</div>
        </AbsoluteFill>
      ) : null}

      {/* 場面ごとの表情キャラ（下部・登場でぴょこっと＋ふわ揺れ） */}
      {charSrc && frame < W.outroStart ? <CharFooter src={charSrc} appearAt={charAppear} /> : null}

      {/* BGM（オルゴール風・全編ループ・低音量） */}
      <Audio src={staticFile("sfx/bgm.wav")} loop volume={0.13} />

      {/* 音声（読み上げ） */}
      <Sequence from={W.frontRead}><Audio src={staticFile(s.front.audio)} /></Sequence>
      {s.backs.map((b, i) => (
        <Sequence key={i} from={W.wins[i].readAt}><Audio src={staticFile(b.audio)} /></Sequence>
      ))}

      {/* 効果音 */}
      <Sequence from={W.xStart}><Audio src={staticFile("sfx/buzzer.wav")} volume={0.85} /></Sequence>
      <Sequence from={W.uraStart}><Audio src={staticFile("sfx/sparkle.wav")} volume={0.6} /></Sequence>
      {s.backs.map((b, i) => (
        <Sequence key={`p${i}`} from={W.wins[i].start}><Audio src={staticFile("sfx/pop.wav")} volume={0.55} /></Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** 場面ごとの表情キャラを下部に表示（登場でぴょこっと＋ふわ揺れ）。 */
const CharFooter: React.FC<{ src: string; appearAt: number }> = ({ src, appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 12, stiffness: 180 }, durationInFrames: Math.round(fps * 0.5) });
  const sc = interpolate(p, [0, 1], [0.55, 1]);
  const dy0 = interpolate(p, [0, 1], [44, 0]);
  const bob = Math.sin((frame / fps) * Math.PI * 2 * 0.5) * 7;
  return (
    <div style={{ position: "absolute", bottom: 200, width: "100%", display: "flex", justifyContent: "center" }}>
      <Img
        src={staticFile(`character/${src}.png`)}
        style={{ height: 430, transform: `translateY(${(dy0 + bob).toFixed(2)}px) scale(${sc.toFixed(3)})`, transformOrigin: "center bottom", filter: "drop-shadow(0 10px 14px rgba(120,80,40,0.2))" }}
      />
    </div>
  );
};

const Segment: React.FC<{ visible: boolean; start: number; fadeOutAt: number; f: number; children: React.ReactNode }> = ({ visible, fadeOutAt, f, children }) => {
  const frame = useCurrentFrame();
  if (!visible) return null;
  const op = interpolate(frame, [fadeOutAt - f, fadeOutAt], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const inO = interpolate(frame, [0, f], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: Math.min(op, inO) }}>{children}</AbsoluteFill>;
};

const CrossHit: React.FC<{ frame: number; start: number; end: number; fps: number }> = ({ frame, start, end, fps }) => {
  const local = frame - start;
  const pe = spring({ frame: local, fps, config: { damping: 9, stiffness: 220 }, durationInFrames: Math.round(fps * 0.4) });
  const sc = interpolate(pe, [0, 1], [0.4, 1]);
  const shake = Math.sin(local * 1.6) * interpolate(local, [0, fps * 0.5], [10, 0], { extrapolateRight: "clamp" });
  const op = interpolate(frame, [end - Math.round(fps * 0.15), end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(214,69,63,0.07)", opacity: op }}>
      <div style={{ transform: `translateX(${shake}px) scale(${sc})`, textAlign: "center" }}>
        <div style={{ fontSize: 300, lineHeight: 1, color: C.x, fontWeight: 700 }}>✕</div>
        <div style={{ fontSize: 64, color: C.x, fontWeight: 700, marginTop: 10 }}>それ、教科書だけ！</div>
      </div>
    </AbsoluteFill>
  );
};
