import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  interpolate,
  spring,
  Easing,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadJP } from "@remotion/google-fonts/NotoSansJP";
import { Mascot } from "./components/Mascot";
import { splitPinyin, colorOf, toneOf } from "./tone.mjs";

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
  /** 例文の「文字ごとのピンイン」（句読点は p:""）。build-today.mjs が生成。 */
  examplePinyin?: { c: string; p: string }[];
  hanziAudio: string;
  exampleAudio: string;
  hanziDur: number;
  exampleDur: number;
};

// 点心カラー（えんじ＋クリーム）
const C = {
  hanzi: "#6B2230", // 深い小豆色
  jp: "#3A2A22", // 温かみのある黒
  accent: "#8E2A3A", // えんじ
  line: "#E0B97E", // 金/タン
  hookText: "#FBF3E3", // クリーム
  exJp: "#8E5A3A", // 茶
  card: "rgba(255,253,248,0.74)", // クリーム白カード
};

// 各パートの「音声以外」の余白（秒）
const T = {
  hook: 1.0,
  revealPause: 0.25,
  readGap: 0.45,
  afterReads: 0.7,
  examplePause: 0.4,
  exampleTail: 1.0,
  cta: 1.8,
  outro: 1.4,
};

function wordSeconds(s: Scene): number {
  return T.revealPause + s.hanziDur + T.readGap + s.hanziDur + T.afterReads;
}
function exampleSeconds(s: Scene): number {
  return T.examplePause + s.exampleDur + T.exampleTail;
}

/** 台本データから動画全体の長さ（フレーム数）を計算する。 */
export function sceneToDurationInFrames(s: Scene, fps: number): number {
  const total = T.hook + wordSeconds(s) + exampleSeconds(s) + T.cta + T.outro;
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
  const s2f = (sec: number) => Math.round(sec * fps);

  // 各パートの開始フレーム
  const fWordStart = s2f(T.hook);
  const fRead1 = fWordStart + s2f(T.revealPause);
  const fRead2 = fRead1 + s2f(s.hanziDur + T.readGap);
  const fExampleStart = fWordStart + s2f(wordSeconds(s));
  const fExampleRead = fExampleStart + s2f(T.examplePause);
  const fCtaStart = fExampleStart + s2f(exampleSeconds(s));
  const fOutroStart = fCtaStart + s2f(T.cta);

  // 連続関数の背景脈動（ループ継ぎ目で飛ばない）
  const bgPulseA = 1 + 0.04 * Math.sin((frame / fps) * Math.PI * 2 * 0.25);
  const bgPulseB = 1 + 0.025 * Math.sin((frame / fps) * Math.PI * 2 * 0.25 + Math.PI);

  // 進捗バー
  const progress = Math.min(1, frame / durationInFrames);
  const barOpacity = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // フック（出入り）
  const hookIn = interpolate(frame, [0, s2f(0.25)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hookExitAt = fExampleStart - s2f(0.4);
  const hookOut = interpolate(frame, [hookExitAt, hookExitAt + s2f(0.4)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const hookOpacity = Math.min(hookIn, hookOut);
  const hookDy = interpolate(frame, [hookExitAt, hookExitAt + s2f(0.4)], [0, -28], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  // 読み上げ拡大の起点（hanziは2回、例文は1回）
  const hanziSpeakStart =
    frame >= fRead1 && frame < fRead1 + s2f(s.hanziDur) ? fRead1 : frame >= fRead2 && frame < fRead2 + s2f(s.hanziDur) ? fRead2 : null;
  const exSpeakStart = frame >= fExampleRead && frame < fExampleRead + s2f(s.exampleDur) ? fExampleRead : null;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg,#FBF4E6 0%,#F6EAD2 55%,#F0E0C2 100%)", fontFamily: jpFont, overflow: "hidden" }}>
      {/* 背景の装飾円（面内グラデ＋逆位相の連続脈動） */}
      <div
        style={{
          position: "absolute",
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%,#FDF6E8,#F1E1C0)",
          top: -520,
          left: -180,
          opacity: 0.5,
          transform: `scale(${bgPulseA})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%,#FDF6E8,#F1E1C0)",
          bottom: -260,
          right: -200,
          opacity: 0.4,
          transform: `scale(${bgPulseB})`,
        }}
      />

      {/* 進捗バー（トラック＋グラデ本体） */}
      <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: "100%", backgroundColor: "rgba(142,42,58,0.16)", opacity: barOpacity }} />
      <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${progress * 100}%`, background: "linear-gradient(90deg,#B33B4A,#8E2A3A)", borderRadius: "0 6px 6px 0", opacity: barOpacity }} />

      {/* カテゴリバッジ（シリーズの見出し） */}
      {s.category ? (
        <AbsoluteFill style={{ opacity: hookOpacity }}>
          <div style={{ position: "absolute", top: 56, width: "100%", display: "flex", justifyContent: "center", transform: `translateY(${hookDy}px)` }}>
            <div style={{ background: "#FBF3E3", border: `2px solid ${C.line}`, color: C.accent, fontSize: 30, fontWeight: 700, padding: "8px 26px", borderRadius: 999, letterSpacing: 1 }}>
              {s.category}
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* フック（上部のラベル） */}
      <AbsoluteFill style={{ opacity: hookOpacity }}>
        <div style={{ position: "absolute", top: 140, width: "100%", display: "flex", justifyContent: "center", transform: `translateY(${hookDy}px)` }}>
          <div style={{ backgroundColor: C.accent, color: C.hookText, fontSize: 50, fontWeight: 500, padding: "20px 52px", borderRadius: 999, boxShadow: "0 12px 30px -12px rgba(142,42,58,0.45)" }}>
            {s.hook}
          </div>
        </div>
      </AbsoluteFill>

      {/* マスコット */}
      <div style={{ position: "absolute", top: 250, width: "100%", display: "flex", justifyContent: "center" }}>
        <Mascot size={330} reactFrame={fWordStart} />
      </div>

      {/* 単語ブロック（白カード：ふりがな式hanzi+pinyin / 意味 / 声調凡例） */}
      <Block enterAt={fWordStart} exit={{ at: fExampleStart, type: "recede", dur: 0.33 }} containerStyle={{ position: "absolute", top: 640, left: "9%", width: "82%" }}>
        <div style={{ background: C.card, borderRadius: 48, padding: "44px 40px 36px", boxShadow: "0 24px 60px -22px rgba(110,50,25,0.22)", textAlign: "center" }}>
          <Speaking startFrame={hanziSpeakStart} durFrames={s2f(s.hanziDur)}>
            <FuriganaWord hanzi={s.hanzi} pinyin={s.pinyin} />
          </Speaking>
          <StaggerRow startFrame={fWordStart + s2f(0.18)}>
            <div style={{ fontSize: 62, color: C.jp, marginTop: 22, fontWeight: 500 }}>{s.meaning}</div>
          </StaggerRow>
        </div>
      </Block>

      {/* 例文ブロック（ふりがな式ピンインつき） */}
      <Block enterAt={fExampleStart} exit={{ at: fCtaStart, type: "up", dur: 0.27 }} containerStyle={{ position: "absolute", top: 1230, left: "9%", width: "82%" }}>
        <div style={{ textAlign: "center", borderTop: `3px solid ${C.line}`, paddingTop: 40 }}>
          <Speaking startFrame={exSpeakStart} durFrames={s2f(s.exampleDur)}>
            <ExampleLine example={s.example} items={s.examplePinyin} />
          </Speaking>
          <StaggerRow startFrame={fExampleStart + s2f(0.15)}>
            <div style={{ fontSize: 44, color: C.exJp, marginTop: 20, lineHeight: 1.4 }}>{s.exampleMeaning}</div>
          </StaggerRow>
        </div>
      </Block>

      {/* CTA（下部・安全圏） */}
      <Block enterAt={fCtaStart} containerStyle={{ position: "absolute", bottom: 380, width: "100%", display: "flex", justifyContent: "center" }}>
        <Cta startFrame={fCtaStart} />
      </Block>

      {/* アウトロ（ブランド締め＋保存促し。ループの継ぎ目にもなる） */}
      <Outro startFrame={fOutroStart} />

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

/** 漢字の各字の真上にピンイン音節を整列（ふりがな式・声調カラー＋上付き番号）。 */
const FuriganaWord: React.FC<{ hanzi: string; pinyin: string }> = ({ hanzi, pinyin }) => {
  const chars = [...hanzi];
  const syls = splitPinyin(pinyin);
  const aligned = chars.length === syls.length;

  if (!aligned) {
    // 字数と音節数が合わないときの安全退避（1行配置）
    return (
      <>
        <div style={{ fontFamily: scFont, fontSize: 190, fontWeight: 700, color: C.hanzi, lineHeight: 1.1, letterSpacing: 6 }}>{hanzi}</div>
        <div style={{ fontFamily: scFont, fontSize: 72, marginTop: 8 }}>
          {syls.map((syl, i, arr) => (
            <span key={i} style={{ color: colorOf(syl), marginRight: i < arr.length - 1 ? 6 : 0 }}>
              {syl}
            </span>
          ))}
        </div>
      </>
    );
  }

  // 文字数に応じてサイズを自動調整（1〜2字は大きく、フレーズは収まるよう縮小）
  const n = chars.length;
  const hanziSize = n <= 2 ? 180 : n === 3 ? 152 : n === 4 ? 122 : 100;
  const pinyinSize = Math.round(hanziSize * 0.32);
  const gap = n <= 2 ? 18 : n === 3 ? 14 : 10;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap }}>
      {chars.map((ch, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontFamily: scFont, fontSize: pinyinSize, lineHeight: 1, marginBottom: 8, color: colorOf(syls[i]), fontWeight: 500 }}>
            {syls[i]}
            <sup style={{ fontSize: "0.4em", fontWeight: 700, marginLeft: 1 }}>{toneOf(syls[i]) || "·"}</sup>
          </span>
          <span style={{ fontFamily: scFont, fontSize: hanziSize, fontWeight: 700, color: C.hanzi, lineHeight: 1 }}>{ch}</span>
        </div>
      ))}
    </div>
  );
};

/** CTA ピル（accentグラデ＋矢印のframe駆動微動）。 */
const Cta: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ax = Math.sin(((frame - startFrame) / fps) * Math.PI * 2 * 0.9) * 6;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 22,
        background: "linear-gradient(135deg,#A8344A,#8E2A3A)",
        padding: "26px 50px",
        borderRadius: 999,
        boxShadow: "0 16px 36px -10px rgba(142,42,58,0.5)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          backgroundColor: "#FBF3E3",
          color: C.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 38,
          fontFamily: scFont,
          fontWeight: 700,
        }}
      >
        包
      </div>
      <span style={{ fontSize: 44, color: "#ffffff", fontWeight: 500 }}>
        アプリで全部おぼえる <span style={{ display: "inline-block", transform: `translateX(${ax}px)` }}>→</span>
      </span>
    </div>
  );
};

/** 例文を文字ごとのふりがな式ピンイン（声調カラー）で表示。データが無ければ素の例文。 */
const ExampleLine: React.FC<{ example: string; items?: { c: string; p: string }[] }> = ({ example, items }) => {
  if (!items || !items.length) {
    return <div style={{ fontFamily: scFont, fontSize: 64, color: C.hanzi, fontWeight: 500, lineHeight: 1.4 }}>{example}</div>;
  }
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 4, flexWrap: "nowrap" }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontFamily: scFont, fontSize: 28, lineHeight: 1, marginBottom: 6, height: 30, color: it.p ? colorOf(it.p) : "transparent" }}>{it.p || "·"}</span>
          <span style={{ fontFamily: scFont, fontSize: 58, fontWeight: 500, color: C.hanzi, lineHeight: 1 }}>{it.c}</span>
        </div>
      ))}
    </div>
  );
};

/** アウトロのブランド締め（マスコット＋ワードマーク＋保存促し＋アプリ名）。 */
const Outro: React.FC<{ startFrame: number }> = ({ startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < startFrame) return null;
  const op = interpolate(frame, [startFrame, startFrame + Math.round(fps * 0.4)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pop = spring({ frame: frame - startFrame, fps, config: { damping: 13, stiffness: 160 }, durationInFrames: Math.round(fps * 0.6) });
  const sc = interpolate(pop, [0, 1], [0.9, 1]);
  return (
    <AbsoluteFill style={{ opacity: op, background: "linear-gradient(180deg,#FBF4E6 0%,#F2E2C2 100%)", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${sc})`, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* バッジ風メダリオン（えんじの円＋金リング）に包くん */}
        <div style={{ width: 360, height: 360, borderRadius: "50%", background: "#8E2A3A", border: "10px solid #EAC98D", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 24px 60px -22px rgba(110,30,30,0.35)" }}>
          <Mascot size={280} reactFrame={startFrame} />
        </div>
        <div style={{ fontSize: 84, fontWeight: 700, color: "#8E2A3A", marginTop: 36, letterSpacing: 2 }}>デイリー中国語</div>
        <div style={{ fontSize: 40, color: "#A0612C", fontWeight: 500, marginTop: 10 }}>毎日ひとこと、リアル中国語</div>
        <div style={{ marginTop: 30, background: "#8E2A3A", color: "#FBF3E3", fontSize: 38, fontWeight: 500, padding: "16px 42px", borderRadius: 999, boxShadow: "0 14px 30px -12px rgba(142,42,58,0.45)" }}>保存して練習しよう</div>
        <div style={{ fontSize: 30, color: "#B0865A", marginTop: 20 }}>@daily_chinese888</div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * 入場（spring pop）と任意の退場（recede/up）を frame 駆動で行う。
 * AbsoluteFill で配置文脈(1080x1920)を保ち、内側コンテンツにだけ transform を当てる
 * ことで、絶対配置(top/bottom)を壊さず自ブロック中心でスケールする。
 */
const Block: React.FC<{
  enterAt: number;
  exit?: { at: number; type: "recede" | "up"; dur: number };
  containerStyle: React.CSSProperties;
  children: React.ReactNode;
}> = ({ enterAt, exit, containerStyle, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < enterAt) return null;

  const pe = spring({ frame: frame - enterAt, fps, config: { damping: 12, stiffness: 170, mass: 0.7 }, durationInFrames: Math.round(fps * 0.6) });
  let scale = interpolate(pe, [0, 1], [0.86, 1]);
  let dy = interpolate(pe, [0, 1], [18, 0]);
  let opacity = interpolate(pe, [0, 1], [0, 1]);

  if (exit && frame >= exit.at) {
    const px = interpolate(frame, [exit.at, exit.at + Math.round(fps * exit.dur)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    if (exit.type === "recede") {
      scale = interpolate(px, [0, 1], [1, 0.94]);
      opacity = interpolate(px, [0, 1], [1, 0.7]);
    } else {
      opacity = interpolate(px, [0, 1], [1, 0]);
      dy = interpolate(px, [0, 1], [0, -40]);
    }
  }

  return (
    <AbsoluteFill>
      <div style={containerStyle}>
        <div style={{ transform: `scale(${scale}) translateY(${dy}px)`, transformOrigin: "center center", opacity, width: "100%" }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};

/** 読み上げ中だけ frame 駆動で軽く拡大（声調の高低を耳と目で結ぶ）。 */
const Speaking: React.FC<{ startFrame: number | null; durFrames: number; children: React.ReactNode }> = ({ startFrame, durFrames, children }) => {
  const frame = useCurrentFrame();
  let scale = 1;
  if (startFrame != null) {
    const local = frame - startFrame;
    scale = interpolate(local, [0, 3, durFrames - 3, durFrames], [1, 1.05, 1.05, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  }
  return <div style={{ transformOrigin: "center center", transform: `scale(${scale})` }}>{children}</div>;
};

/** 行ごとに少し遅らせて下からふわっと出す。 */
const StaggerRow: React.FC<{ startFrame: number; children: React.ReactNode }> = ({ startFrame, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - startFrame, fps, config: { damping: 18, stiffness: 140 } });
  const opacity = interpolate(p, [0, 1], [0, 1]);
  const dy = interpolate(p, [0, 1], [16, 0]);
  return <div style={{ opacity, transform: `translateY(${dy}px)` }}>{children}</div>;
};
