import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { synthesize } from "./tts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AUDIO = path.join(ROOT, "public", "audio");
const round = (n) => Math.round(n * 1000) / 1000;

function pickIndex(count) {
  // 手動/バッチは WORD_INDEX を優先（カウンターに影響しない）
  if (process.env.WORD_INDEX != null && process.env.WORD_INDEX !== "") {
    return ((Number(process.env.WORD_INDEX) % count) + count) % count;
  }
  // 毎日の自動投稿は posted-log.json の連番カウンターでカタログ順を厳守
  try {
    const log = JSON.parse(readFileSync(path.join(ROOT, "posted-log.json"), "utf8"));
    if (Number.isInteger(log.nextUra)) return ((log.nextUra % count) + count) % count;
  } catch {}
  return Math.floor(Date.now() / 86400000) % count; // フォールバック
}

const config = JSON.parse(await readFile(path.join(ROOT, "config.json"), "utf8"));
const voice = config.voice ?? "zh-CN-XiaoxiaoNeural";
const rate = config.rate ?? "-10%";

const entries = JSON.parse(await readFile(path.join(ROOT, "ura_seed.json"), "utf8"));
const idx = pickIndex(entries.length);
const e = entries[idx];

await mkdir(AUDIO, { recursive: true });
console.log(`今日のお題 [#${idx}] ${e.category}: ${e.front.hanzi} → ${e.backs.map((b) => b.hanzi).join("/")}`);

const front = await synthesize({ text: e.front.hanzi, outMp3: path.join(AUDIO, "u_front.mp3"), voice, rate });
const backs = [];
for (let i = 0; i < e.backs.length; i++) {
  const a = await synthesize({ text: e.backs[i].hanzi, outMp3: path.join(AUDIO, `u_back${i}.mp3`), voice, rate });
  backs.push({ ...e.backs[i], audio: `audio/u_back${i}.mp3`, dur: round(a.duration) });
}

const scene = {
  category: e.category,
  front: { ...e.front, audio: "audio/u_front.mp3", dur: round(front.duration) },
  backs,
  index: idx,
};

await writeFile(path.join(ROOT, "public", "today-ura.json"), JSON.stringify(scene, null, 2));
console.log("台本: public/today-ura.json");
