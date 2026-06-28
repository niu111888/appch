import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, staticFile, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadJP } from "@remotion/google-fonts/NotoSansJP";
import { splitPinyin, colorOf } from "./tone.mjs";

const { fontFamily: scFont } = loadSC("normal", { weights: ["400", "500", "700"] });
const { fontFamily: jpFont } = loadJP("normal", { weights: ["400", "500", "700"] });

type TrapItem = { hanzi: string; pinyin: string; guessLabel?: string; jp: string; real: string; example: string; exampleMeaning: string; audio: string; dur: number };
export type TrapScene = { category: string; subtitle: string; items: TrapItem[]; index?: number };

const C = {
  bg: "#F4EEDE",
  ink: "#5A4636",
  inkSoft: "#8C7A66",
  hanzi: "#4A3A2C",
  guessCard: "#ECE6D8",
  guessInk: "#9A9183",
  x: "#D6453F",
  good: "#3FA66A",
  accent: "#E07A8E",
  card: "#FFFDF6",
  line: "#E3C99B",
};

const T = { intro: 1.0, hanziIn: 0.4, guessHold: 1.15, cross: 0.85, reveal: 0.55, exGap: 0.6, exHold: 1.7, outro: 2.0 };

function trapWindows(s: TrapScene, fps: number) {
  const s2f = (x: number) => Math.round(x * fps);
  const introEnd = s2f(T.intro);
  let cursor = introEnd;
  const items = s.items.map((it) => {
    const start = cursor;
    const guessAt = start + s2f(T.hanziIn);
    const readAt = guessAt;
    const crossAt = guessAt + Math.max(s2f(it.dur), s2f(0.9)) + s2f(T.guessHold);
    const revealAt = crossAt + s2f(T.cross);
    const exampleAt = revealAt + s2f(T.reveal) + s2f(T.exGap);
    const end = exampleAt + s2f(T.exHold);
    cursor = end;
    return { start, guessAt, readAt, crossAt, revealAt, exampleAt, end };
  });
  const outroStart = cursor;
  return { introEnd, items, outroStart, total: outroStart + s2f(T.outro) };
}

export function sceneToFramesTrap(s: TrapScene, fps: number): number {
  return trapWindows(s, fps).total;
}

const FALLBACK: TrapScene = {
  category: "同じ漢字でも意味が違う中国語",
  subtitle: "日本語の感覚で読むと事故るやつ",
  items: [{ hanzi: "手纸", pinyin: "shǒu zhǐ", guessLabel: "日本語だと", jp: "手紙（レター）", real: "トイレットペーパー", example: "厕所没手纸了。", exampleMeaning: "トイレにペーパーが無い。", audio: "audio/t_item0.mp3", dur: 1 }],
};

const fade = (frame: number, start: number, end: number, f: number) =>
  Math.min(
    interpolate(frame, [start, start + f], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [end - f, end], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
  );

const sizeHan = (h: string) => { const n = [...h].length; return n <= 2 ? 200 : n === 3 ? 150 : 120; };
const sizeJP = (t: string) => (t.length <= 6 ? 60 : t.length <= 10 ? 50 : 42);
const sizeReal = (t: string) => (t.length <= 7 ? 76 : t.length <= 11 ? 60 : 50);

export const TrapShort: React.FC<{ scene?: TrapScene }> = ({ scene }) => {
  const s = scene ?? FALLBACK;
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const s2f = (x: number) => Math.round(x * fps);
  const W = trapWindows(s, fps);
  const f = s2f(0.18);

  const cur = W.items.findIndex((w) => frame >= w.start && frame < w.end);
  const inItems = cur >= 0;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: jpFont, overflow: "hidden" }}>
      {/* イントロ：シリーズ名 */}
      {frame < W.introEnd ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: fade(frame, 0, W.introEnd, f) }}>
          <div style={{ fontSize: 40, color: C.accent, fontWeight: 700, letterSpacing: 2 }}>中国語クイズ</div>
          <div style={{ fontSize: 78, color: C.ink, fontWeight: 700, marginTop: 14, textAlign: "center", lineHeight: 1.25, width: "86%" }}>{s.category}</div>
          <div style={{ fontSize: 40, color: C.inkSoft, marginTop: 18 }}>{s.subtitle}</div>
        </AbsoluteFill>
      ) : null}

      {/* 上部：シリーズ小ラベル（出題中） */}
      {inItems ? (
        <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{ background: C.accent, color: "#fff", fontSize: 34, fontWeight: 700, padding: "10px 30px", borderRadius: 999 }}>{s.category}</div>
        </div>
      ) : null}

      {/* 各設問 */}
      {s.items.map((it, i) => {
        const w = W.items[i];
        if (frame < w.start || frame >= w.end) return null;
        const pe = spring({ frame: frame - w.start, fps, config: { damping: 13, stiffness: 170 }, durationInFrames: s2f(0.5) });
        const hsc = interpolate(pe, [0, 1], [0.7, 1]);
        const speaking = frame >= w.readAt && frame < w.readAt + s2f(it.dur);
        const showGuess = frame >= w.guessAt && frame < w.revealAt;
        const showReal = frame >= w.revealAt;
        const showCross = frame >= w.crossAt && frame < w.revealAt + s2f(0.2);
        const rp = spring({ frame: frame - w.revealAt, fps, config: { damping: 12, stiffness: 200 }, durationInFrames: s2f(0.45) });

        return (
          <AbsoluteFill key={i}>
            {/* 単語（大きく・上） */}
            <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", transform: `scale(${hsc})`, transformOrigin: "center top" }}>
              <div style={{ fontFamily: scFont, fontSize: sizeHan(it.hanzi), fontWeight: 700, color: C.hanzi, lineHeight: 1, transform: speaking ? "scale(1.04)" : "scale(1)" }}>{it.hanzi}</div>
              <div style={{ fontFamily: scFont, fontSize: 64, marginTop: 12 }}>
                {splitPinyin(it.pinyin).map((syl, k, arr) => (
                  <span key={k} style={{ color: colorOf(syl), marginRight: k < arr.length - 1 ? 8 : 0 }}>{syl}</span>
                ))}
              </div>
            </div>

            {/* 予想（日本語だと…？） */}
            {showGuess ? (
              <div style={{ position: "absolute", top: 720, left: "8%", width: "84%", opacity: fade(frame, w.guessAt, w.revealAt, f) }}>
                <div style={{ background: C.guessCard, borderRadius: 40, padding: "34px 30px", textAlign: "center", border: `2px dashed ${C.guessInk}` }}>
                  <div style={{ fontSize: 34, color: C.guessInk, fontWeight: 700 }}>{it.guessLabel ?? "日本語だと"}…？</div>
                  <div style={{ fontSize: sizeJP(it.jp), color: C.guessInk, fontWeight: 700, marginTop: 12 }}>「{it.jp}」</div>
                </div>
              </div>
            ) : null}

            {/* ❌ ブッブー */}
            {showCross ? <Cross frame={frame} start={w.crossAt} fps={fps} /> : null}

            {/* 正解（中国語では実は…） */}
            {showReal ? (
              <div style={{ position: "absolute", top: 700, left: "8%", width: "84%", opacity: fade(frame, w.revealAt, w.end, f), transform: `scale(${interpolate(rp, [0, 1], [0.86, 1])})`, transformOrigin: "center top" }}>
                <div style={{ background: C.card, borderRadius: 44, padding: "38px 32px", textAlign: "center", boxShadow: "0 22px 50px -24px rgba(120,80,40,0.3)", border: `3px solid ${C.good}` }}>
                  <div style={{ display: "inline-block", background: C.good, color: "#fff", fontSize: 32, fontWeight: 700, padding: "6px 24px", borderRadius: 999 }}>中国語では実は…</div>
                  <div style={{ fontSize: sizeReal(it.real), color: C.hanzi, fontWeight: 700, marginTop: 18, lineHeight: 1.15 }}>{it.real}</div>
                  {frame >= w.exampleAt ? (
                    <div style={{ marginTop: 22, paddingTop: 18, borderTop: `2px solid ${C.line}`, opacity: fade(frame, w.exampleAt, w.end, f) }}>
                      <div style={{ fontFamily: scFont, fontSize: 44, color: C.hanzi }}>{it.example}</div>
                      <div style={{ fontSize: 32, color: C.inkSoft, marginTop: 8 }}>{it.exampleMeaning}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </AbsoluteFill>
        );
      })}

      {/* アウトロ */}
      {frame >= W.outroStart ? (
        <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center", opacity: interpolate(frame, [W.outroStart, W.outroStart + f], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <Img src={staticFile("character/logo.png")} style={{ width: 760, objectFit: "contain" }} />
          <div style={{ fontSize: 46, color: C.ink, fontWeight: 700, marginTop: 4 }}>教科書にないリアル中国語</div>
          <div style={{ marginTop: 28, background: C.x, color: "#fff", fontSize: 40, fontWeight: 700, padding: "18px 44px", borderRadius: 999 }}>プロフのURL → アプリで学ぶ</div>
        </AbsoluteFill>
      ) : null}

      {/* 表情キャラ：出題中＝真面目パンダ / 正解で＝わくわく */}
      {inItems && frame < W.outroStart ? (
        <TrapChar src={frame >= W.items[cur].revealAt ? "panda_excited" : "panda_studious"} appearAt={W.items[cur].start} />
      ) : null}

      {/* BGM */}
      <Audio src={staticFile("sfx/bgm.wav")} loop volume={0.13} />

      {/* 音声（単語の読み上げ） */}
      {s.items.map((it, i) => (
        <Sequence key={i} from={W.items[i].readAt}><Audio src={staticFile(it.audio)} /></Sequence>
      ))}

      {/* 効果音 */}
      {s.items.map((it, i) => (
        <React.Fragment key={`s${i}`}>
          <Sequence from={W.items[i].crossAt}><Audio src={staticFile("sfx/buzzer.wav")} volume={0.85} /></Sequence>
          <Sequence from={W.items[i].revealAt}><Audio src={staticFile("sfx/sparkle.wav")} volume={0.6} /></Sequence>
        </React.Fragment>
      ))}
    </AbsoluteFill>
  );
};

const TrapChar: React.FC<{ src: string; appearAt: number }> = ({ src, appearAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - appearAt, fps, config: { damping: 12, stiffness: 180 }, durationInFrames: Math.round(fps * 0.5) });
  const sc = interpolate(p, [0, 1], [0.6, 1]);
  const bob = Math.sin((frame / fps) * Math.PI * 2 * 0.5) * 6;
  return (
    <div style={{ position: "absolute", bottom: 120, width: "100%", display: "flex", justifyContent: "center" }}>
      <Img src={staticFile(`character/${src}.png`)} style={{ height: 360, transform: `translateY(${bob.toFixed(2)}px) scale(${sc.toFixed(3)})`, transformOrigin: "center bottom", filter: "drop-shadow(0 10px 14px rgba(120,80,40,0.2))" }} />
    </div>
  );
};

const Cross: React.FC<{ frame: number; start: number; fps: number }> = ({ frame, start, fps }) => {
  const local = frame - start;
  const pe = spring({ frame: local, fps, config: { damping: 9, stiffness: 220 }, durationInFrames: Math.round(fps * 0.4) });
  const sc = interpolate(pe, [0, 1], [0.4, 1]);
  const shake = Math.sin(local * 1.6) * interpolate(local, [0, fps * 0.5], [10, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: "rgba(214,69,63,0.07)" }}>
      <div style={{ transform: `translateX(${shake}px) scale(${sc})`, textAlign: "center" }}>
        <div style={{ fontSize: 260, lineHeight: 1, color: C.x, fontWeight: 700 }}>✕</div>
        <div style={{ fontSize: 60, color: C.x, fontWeight: 700, marginTop: 6 }}>ブッブー！違う！</div>
      </div>
    </AbsoluteFill>
  );
};
