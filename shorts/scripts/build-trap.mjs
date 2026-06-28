import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { synthesize } from "./tts.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AUDIO = path.join(ROOT, "public", "audio");
const round = (n) => Math.round(n * 1000) / 1000;

function pickIndex(count) {
  if (process.env.WORD_INDEX != null && process.env.WORD_INDEX !== "") {
    return ((Number(process.env.WORD_INDEX) % count) + count) % count;
  }
  return Math.floor(Date.now() / 86400000) % count;
}

const config = JSON.parse(await readFile(path.join(ROOT, "config.json"), "utf8"));
const voice = config.voice ?? "zh-CN-XiaoxiaoNeural";
const rate = config.rate ?? "-10%";

const entries = JSON.parse(await readFile(path.join(ROOT, "ura_trap_seed.json"), "utf8"));
const idx = pickIndex(entries.length);
const e = entries[idx];

await mkdir(AUDIO, { recursive: true });
console.log(`罠クイズ [#${idx}] ${e.category}: ${e.items.map((it) => it.hanzi).join("/")}`);

const items = [];
for (let i = 0; i < e.items.length; i++) {
  const a = await synthesize({ text: e.items[i].hanzi, outMp3: path.join(AUDIO, `t_item${i}.mp3`), voice, rate });
  items.push({ ...e.items[i], audio: `audio/t_item${i}.mp3`, dur: round(a.duration) });
}

const scene = { category: e.category, subtitle: e.subtitle, items, index: idx };
await writeFile(path.join(ROOT, "public", "today-trap.json"), JSON.stringify(scene, null, 2));
console.log("台本: public/today-trap.json");
