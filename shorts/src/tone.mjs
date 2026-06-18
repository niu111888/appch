// ピンインを音節に分割し、各音節の声調(1〜4, 0=軽声)を判定して色を割り当てる。

const T1 = "āēīōūǖ";
const T2 = "áéíóúǘ";
const T3 = "ǎěǐǒǔǚ";
const T4 = "àèìòùǜ";

// 声調記号つきを含む母音すべて
const V = "aāáǎàeēéěèiīíǐìoōóǒòuūúǔùüǖǘǚǜ";
const SYLLABLE = new RegExp(
  `(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])?[${V}]+(?:ng|n|r)?`,
  "gi"
);

/** "xièxie" → ["xiè","xie"], "nǐ hǎo" → ["nǐ","hǎo"] */
export function splitPinyin(pinyin) {
  const matched = pinyin.replace(/\s+/g, "").match(SYLLABLE);
  return matched && matched.length ? matched : [pinyin];
}

/** 音節の声調番号（1〜4、無ければ0=軽声） */
export function toneOf(syllable) {
  for (const ch of syllable) {
    if (T1.includes(ch)) return 1;
    if (T2.includes(ch)) return 2;
    if (T3.includes(ch)) return 3;
    if (T4.includes(ch)) return 4;
  }
  return 0;
}

/** 声調 → 色（ピンク背景でも読める濃さ） */
export const TONE_COLORS = {
  1: "#C0392B", // 第一声（高く平ら）赤
  2: "#1D9E75", // 第二声（上がる）緑
  3: "#2980B9", // 第三声（下がって上がる）青
  4: "#8E44AD", // 第四声（下がる）紫
  0: "#8E8E8E", // 軽声 グレー
};

export function colorOf(syllable) {
  return TONE_COLORS[toneOf(syllable)];
}
