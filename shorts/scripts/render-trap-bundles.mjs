// 罠クイズ2本をフル書き出し→投稿用フォルダの33/34に差し替え＋キャプション生成。
// あわせて ura_seed.json から罠2ネタを除去（表/裏フォーマットでの誤rendering防止）。
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildTrapCaption } from "./caption.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(process.env.HOME, "Desktop", "裏中国語_投稿用_全34本");
const run = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });

// 1) ura_seed.json から罠カテゴリを除去
const TRAP_CATS = new Set(["直訳厳禁の罠", "日本語と意味が違う罠"]);
const seedPath = path.join(ROOT, "ura_seed.json");
const seed = JSON.parse(readFileSync(seedPath, "utf8"));
const filtered = seed.filter((e) => !TRAP_CATS.has(e.category));
writeFileSync(seedPath, JSON.stringify(filtered, null, 2) + "\n");
console.log(`ura_seed: ${seed.length} → ${filtered.length}本（罠2ネタを除去）`);

// 2) 罠2本をレンダリング → 33/34に差し替え
//    trap#1=直訳厳禁(吃醋/吃瓜/呵呵)→33 / trap#0=同じ漢字(手纸/爱人/勉强)→34
const MAP = [
  { idx: 1, nn: "33", name: "直訳厳禁の罠" },
  { idx: 0, nn: "34", name: "日本語と意味が違う罠" },
];
for (const m of MAP) {
  console.log(`\n=== 罠 WORD_INDEX=${m.idx} → ${m.nn}_${m.name} ===`);
  run("node", ["scripts/build-trap.mjs"], { WORD_INDEX: String(m.idx) });
  run("node", ["scripts/render-trap.mjs"]);
  const s = JSON.parse(readFileSync(path.join(ROOT, "public", "today-trap.json"), "utf8"));
  const cap = buildTrapCaption(s);
  const base = path.join(OUT, `${m.nn}_${m.name}`);
  copyFileSync(path.join(ROOT, "out", "trap.mp4"), `${base}.mp4`);
  writeFileSync(`${base}_キャプション.txt`, `▼タイトル(YouTube用)\n${cap.title}\n\n▼キャプション(Instagram/共通・コピペ用)\n${cap.instagramCaption}\n`);
  console.log(`✓ ${base}.mp4`);
}
console.log("\n完了：罠クイズ2本を新フォーマットで差し替え");
