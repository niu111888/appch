// 表/裏32本(既存)＋罠14本(新規render)を投稿順に1フォルダへまとめ、投稿スケジュールを作る。
// YouTube=自動(表/裏)。このフォルダ＆md=Instagram手動投稿用の順番。
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildTrapCaption } from "./caption.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HOME = process.env.HOME;
const SRC_UB = path.join(HOME, "Desktop", "裏中国語_投稿用_全34本"); // 既存の表/裏
const OUT = path.join(HOME, "Desktop", "裏中国語_投稿用_完全版");
const STAGE = path.join(ROOT, "out", "trapstage");
mkdirSync(OUT, { recursive: true });
mkdirSync(STAGE, { recursive: true });
const run = (a, env = {}) => execFileSync("node", a, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });
const safe = (s) => s.replace(/[\/\\:*?"<>|！]/g, "");

const ura = JSON.parse(readFileSync(path.join(ROOT, "ura_seed.json"), "utf8")); // 32
const trap = JSON.parse(readFileSync(path.join(ROOT, "ura_trap_seed.json"), "utf8")); // 14

// 1) 罠14本をレンダリング → ステージング
const trapItems = [];
for (let i = 0; i < trap.length; i++) {
  console.log(`\n=== 罠 ${i + 1}/${trap.length} (${trap[i].category}) ===`);
  run(["scripts/build-trap.mjs"], { WORD_INDEX: String(i) });
  const s = JSON.parse(readFileSync(path.join(ROOT, "public", "today-trap.json"), "utf8"));
  const mp4 = path.join(STAGE, `t${i}.mp4`);
  if (existsSync(mp4)) {
    console.log("  (既存staging再利用)");
  } else {
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try { run(["scripts/render-trap.mjs"]); copyFileSync(path.join(ROOT, "out", "trap.mp4"), mp4); ok = true; }
      catch (e) { console.log(`  ⚠️ render失敗 ${attempt}/3: ${String(e.message).slice(0, 70)}`); }
    }
    if (!ok) throw new Error(`罠${i} render失敗`);
  }
  trapItems.push({ type: "罠", title: s.category, mp4, cap: buildTrapCaption(s) });
}

// 2) 既存の表/裏 01-32 を順番に拾う（= ura_seed[0..31]）
const ubFiles = readdirSync(SRC_UB).filter((f) => /^(0[1-9]|[12][0-9]|3[0-2])_.*\.mp4$/.test(f)).sort();
const ubItems = ubFiles.map((f, i) => ({
  type: "表裏",
  title: `${ura[i].category}「${ura[i].front.meaning}」`,
  mp4: path.join(SRC_UB, f),
  capFile: path.join(SRC_UB, f.replace(".mp4", "_キャプション.txt")),
}));

// 3) 投稿順に並べる：3本ごとに罠を1本はさむ（表裏2 : 罠1 でバランス）
const order = [];
let u = 0, t = 0;
for (let pos = 1; u < ubItems.length || t < trapItems.length; pos++) {
  if (pos % 3 === 0 && t < trapItems.length) order.push(trapItems[t++]);
  else if (u < ubItems.length) order.push(ubItems[u++]);
  else if (t < trapItems.length) order.push(trapItems[t++]);
}

// 4) 連番でコピー＋スケジュールmd
let md = `# 裏・中国語 投稿スケジュール（全${order.length}本）\n\n`;
md += `- **YouTube**：毎日自動投稿（表/裏）。手動操作は不要。\n`;
md += `- **Instagram**：この順番で手動投稿。各動画と同名の \`_キャプション.txt\` を貼り付けるだけ。\n`;
md += `- 投稿したら下のチェックを ☑ に。表/裏と罠クイズが交互に来る構成。\n\n`;
md += `| # | 済 | 種類 | タイトル | ファイル |\n|---|---|---|---|---|\n`;
order.forEach((o, idx) => {
  const nn = String(idx + 1).padStart(2, "0");
  const base = path.join(OUT, `${nn}_${o.type}_${safe(o.title)}`);
  copyFileSync(o.mp4, `${base}.mp4`);
  if (o.cap) writeFileSync(`${base}_キャプション.txt`, `▼タイトル(YouTube用)\n${o.cap.title}\n\n▼キャプション(Instagram用)\n${o.cap.instagramCaption}\n`);
  else copyFileSync(o.capFile, `${base}_キャプション.txt`);
  md += `| ${idx + 1} | ☐ | ${o.type} | ${o.title} | ${nn}_${o.type}_${safe(o.title)}.mp4 |\n`;
});
writeFileSync(path.join(OUT, "_投稿スケジュール.md"), md);
console.log(`\n完了：全${order.length}本 → ${OUT}`);
