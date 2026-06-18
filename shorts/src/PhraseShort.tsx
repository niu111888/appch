import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadJP } from "@remotion/google-fonts/NotoSansJP";
import { Mascot } from "./components/Mascot";
import { splitPinyin, colorOf } from "./tone.mjs";

const { fontFamily: scFont } = loadSC("normal", { weights: ["400", "500", "700"] });
const { fontFamily: jpFont } = loadJP("normal", { weights: ["400", "500", "700"] });

/** 1本の動画に必要な台本データ。build-today.mjs が public/today.json に書き出す。 */
export type Scene = {
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
  exampleMeaning: string;
  hook: string;
  /** staticFile からの相対パス。例: "audio/hanzi.mp3" */
  hanziAudio: string;
  exampleAudio: string;
  /** 秒。edge-tts の字幕から算出した実測の発話長。 */
  hanziDur: number;
  exampleDur: number;
};

// テーマ色（モックアップと同じピンク系）
const C = {
  bg: "#FBEAF0",
  hanzi: "#4B1528",
  pinyin: "#993556",
  jp: "#2C2C2A",
  accent: "#D4537E",
  line: "#ED93B1",
  hookText: "#FBEAF0",
  exJp: "#72243E",
};

// 各パートの「音声以外」の余白（秒）
const T = {
  hook: 1.6,
  revealPause: 0.5, // 単語が出てから1回目を読むまで
  readGap: 0.45, // 1回目と2回目の読みの間
  afterReads: 0.7, // 2回目の読み終わりから例文へ
  examplePause: 0.4, // 例文が出てから読むまで
  exampleTail: 1.0, // 例文を読み終わってから
  cta: 2.2,
};

function wordSeconds(s: Scene): number {
  return T.revealPause + s.hanziDur + T.readGap + s.hanziDur + T.afterReads;
}
function exampleSeconds(s: Scene): number {
  return T.examplePause + s.exampleDur + T.exampleTail;
}

/** 台本データから動画全体の長さ（フレーム数）を計算する。 */
export function sceneToDurationInFrames(s: Scene, fps: number): number {
  const total = T.hook + wordSeconds(s) + exampleSeconds(s) + T.cta;
  return Math.ceil(total * fps);
}

const FALLBACK: Scene = {
  hanzi: "谢谢",
  pinyin: "xièxie",
  meaning: "ありがとう",
  example: "谢谢你的帮助。",
  exampleMeaning: "助けてくれてありがとう。",
  hook: "今日の一言",
  hanziAudio: "audio/hanzi.mp3",
  exampleAudio: "audio/example.mp3",
  hanziDur: 1.2,
  exampleDur: 2.0,
};

export const PhraseShort: React.FC<{ scene?: Scene }> = ({ scene }) => {
  const s = scene ?? FALLBACK;
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const progress = Math.min(1, frame / durationInFrames);
  const s2f = (sec: number) => Math.round(sec * fps);

  // 各パートの開始フレーム
  const fWordStart = s2f(T.hook);
  const fRead1 = fWordStart + s2f(T.revealPause);
  const fRead2 = fRead1 + s2f(s.hanziDur + T.readGap);
  const fExampleStart = fWordStart + s2f(wordSeconds(s));
  const fExampleRead = fExampleStart + s2f(T.examplePause);
  const fCtaStart = fExampleStart + s2f(exampleSeconds(s));

  // 全体の薄い背景アニメ（じわっと拡大する円）
  const bgPulse = interpolate(frame % (fps * 4), [0, fps * 2, fps * 4], [1, 1.08, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: jpFont, overflow: "hidden" }}>
      {/* 背景の装飾円 */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: "#F7D9E4",
          top: -500,
          left: -160,
          opacity: 0.6,
          transform: `scale(${bgPulse})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "#F7D9E4",
          bottom: -260,
          right: -200,
          opacity: 0.5,
        }}
      />

      {/* 上部の進捗バー */}
      <div style={{ position: "absolute", top: 0, left: 0, height: 12, width: `${progress * 100}%`, backgroundColor: C.accent }} />

      {/* フック（上部のラベル） */}
      <FadeIn from={0} fps={fps}>
        <div
          style={{
            position: "absolute",
            top: 150,
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: C.accent,
              color: C.hookText,
              fontSize: 52,
              fontWeight: 500,
              padding: "20px 52px",
              borderRadius: 999,
            }}
          >
            {s.hook}
          </div>
        </div>
      </FadeIn>

      {/* マスコット */}
      <div style={{ position: "absolute", top: 300, width: "100%", display: "flex", justifyContent: "center" }}>
        <Mascot size={360} />
      </div>

      {/* 単語ブロック（hanzi / pinyin / 意味） */}
      <PopIn at={fWordStart} fps={fps}>
        <div style={{ position: "absolute", top: 760, width: "100%", textAlign: "center" }}>
          <Speaking active={frame >= fRead1 && frame < fRead1 + s2f(s.hanziDur)} secondary={frame >= fRead2 && frame < fRead2 + s2f(s.hanziDur)}>
            <div style={{ fontFamily: scFont, fontSize: 200, fontWeight: 700, color: C.hanzi, lineHeight: 1.1, letterSpacing: 6 }}>
              {s.hanzi}
            </div>
          </Speaking>
          <div style={{ fontFamily: scFont, fontSize: 76, marginTop: 8 }}>
            {splitPinyin(s.pinyin).map((syl, i, arr) => (
              <span key={i} style={{ color: colorOf(syl), marginRight: i < arr.length - 1 ? 6 : 0 }}>
                {syl}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 64, color: C.jp, marginTop: 24, fontWeight: 500 }}>{s.meaning}</div>
        </div>
      </PopIn>

      {/* 例文ブロック */}
      <PopIn at={fExampleStart} fps={fps}>
        <div
          style={{
            position: "absolute",
            top: 1240,
            width: "84%",
            left: "8%",
            textAlign: "center",
            borderTop: `3px solid ${C.line}`,
            paddingTop: 44,
          }}
        >
          <Speaking active={frame >= fExampleRead && frame < fExampleRead + s2f(s.exampleDur)}>
            <div style={{ fontFamily: scFont, fontSize: 70, color: C.hanzi, fontWeight: 500, lineHeight: 1.4 }}>{s.example}</div>
          </Speaking>
          <div style={{ fontSize: 46, color: C.exJp, marginTop: 20, lineHeight: 1.4 }}>{s.exampleMeaning}</div>
        </div>
      </PopIn>

      {/* CTA（下部・アプリ誘導） */}
      <PopIn at={fCtaStart} fps={fps}>
        <div style={{ position: "absolute", bottom: 150, width: "100%", display: "flex", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              backgroundColor: "#ffffff",
              padding: "26px 48px",
              borderRadius: 999,
              border: `3px solid ${C.line}`,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: C.accent,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 38,
                fontFamily: scFont,
                fontWeight: 700,
              }}
            >
              汉
            </div>
            <span style={{ fontSize: 44, color: C.jp, fontWeight: 500 }}>アプリで全部おぼえる →</span>
          </div>
        </div>
      </PopIn>

      {/* 音声 */}
      <Sequence from={fRead1}>
        <Audio src={staticFile(s.hanziAudio)} />
      </Sequence>
      <Sequence from={fRead2}>
        <Audio src={staticFile(s.hanziAudio)} />
      </Sequence>
      <Sequence from={fExampleRead}>
        <Audio src={staticFile(s.exampleAudio)} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * 指定フレームで spring によりポップして登場する。
 * 全画面の AbsoluteFill を被せることで、中の絶対配置(top/bottom)が
 * 常に 1080x1920 を基準に解決されるようにしている。
 */
const PopIn: React.FC<{ at: number; fps: number; children: React.ReactNode }> = ({ at, fps, children }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const local = frame - at;
  const progress = spring({ frame: local, fps, config: { damping: 14, stiffness: 120 }, durationInFrames: Math.round(fps * 0.6) });
  const scale = interpolate(progress, [0, 1], [0.7, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  return <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>{children}</AbsoluteFill>;
};

/** フェードインのみ。 */
const FadeIn: React.FC<{ from: number; fps: number; children: React.ReactNode }> = ({ from, fps, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + Math.round(fps * 0.5)], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

/** 読み上げ中だけ少し拡大して「喋ってる感」を出す。 */
const Speaking: React.FC<{ active: boolean; secondary?: boolean; children: React.ReactNode }> = ({ active, secondary, children }) => {
  const on = active || secondary;
  return (
    <div
      style={{
        transform: on ? "scale(1.06)" : "scale(1)",
        transition: "transform 0.12s ease-out",
        display: "inline-block",
      }}
    >
      {children}
    </div>
  );
};
