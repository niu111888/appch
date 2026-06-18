import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { synthesize } from "./tts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// アプリと共有する単語データ（唯一のソース）
const SEED = path.resolve(ROOT, "..", "appch", "Resources", "hsk1_seed.json");
const PUBLIC = path.join(ROOT, "public");
const AUDIO = path.join(PUBLIC, "audio");

const round = (n) => Math.round(n * 1000) / 1000;

/** その日の単語インデックスを決める。WORD_INDEX で固定も可能（テスト用）。 */
function pickIndex(count) {
  if (process.env.WORD_INDEX != null && process.env.WORD_INDEX !== "") {
    return ((Number(process.env.WORD_INDEX) % count) + count) % count;
  }
  // UTC日付ベースで毎日ひとつずつ進める
  const epochDays = Math.floor(Date.now() / 86400000);
  return epochDays % count;
}

const config = JSON.parse(await readFile(path.join(ROOT, "config.json"), "utf8"));
const words = JSON.parse(await readFile(SEED, "utf8"));
const idx = pickIndex(words.length);
const w = words[idx];

await mkdir(AUDIO, { recursive: true });

const voice = config.voice ?? "zh-CN-XiaoxiaoNeural";
const rate = config.rate ?? "-10%";

console.log(`今日の単語 [#${idx}]: ${w.hanzi}（${w.pinyin}）${w.meaning}`);
console.log("音声を合成中…");

const hanzi = await synthesize({ text: w.hanzi, outMp3: path.join(AUDIO, "hanzi.mp3"), voice, rate });
const example = await synthesize({ text: w.example, outMp3: path.join(AUDIO, "example.mp3"), voice, rate });

const scene = {
  hanzi: w.hanzi,
  pinyin: w.pinyin,
  meaning: w.meaning,
  example: w.example,
  exampleMeaning: w.exampleMeaning,
  hook: (config.hookTemplate ?? "中国語で「{meaning}」は？").replace("{meaning}", w.meaning),
  hanziAudio: "audio/hanzi.mp3",
  exampleAudio: "audio/example.mp3",
  hanziDur: round(hanzi.duration),
  exampleDur: round(example.duration),
  index: idx,
};

await writeFile(path.join(PUBLIC, "today.json"), JSON.stringify(scene, null, 2));
console.log(`台本を書き出し: public/today.json（hanzi ${scene.hanziDur}s / 例文 ${scene.exampleDur}s）`);
