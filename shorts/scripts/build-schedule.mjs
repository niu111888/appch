// 表/裏32本(既存)＋罠14本を投稿順に1フォルダへまとめ、投稿スケジュールを作る。
// 罠はbundle＋ブラウザ起動を1回だけにして14本を連続レンダ（プロセス枯渇によるタイムアウト回避）。
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, ensureBrowser } from "@remotion/renderer";
import { buildTrapCaption } from "./caption.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const HOME = process.env.HOME;
const SRC_UB = path.join(HOME, "Desktop", "裏中国語_投稿用_全34本");
const OUT = path.join(HOME, "Desktop", "裏中国語_投稿用_完全版");
const STAGE = path.join(ROOT, "out", "trapstage");
mkdirSync(OUT, { recursive: true });
mkdirSync(STAGE, { recursive: true });
const safe = (s) => s.replace(/[\/\\:*?"<>|！]/g, "");

const ura = JSON.parse(readFileSync(path.join(ROOT, "ura_seed.json"), "utf8"));
const trap = JSON.parse(readFileSync(path.join(ROOT, "ura_trap_seed.json"), "utf8"));

// 1) 罠14本を1バンドルで連続レンダ
console.log("準備中（bundle＋browserを1回だけ）…");
await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
const trapItems = [];
for (let i = 0; i < trap.length; i++) {
  console.log(`\n=== 罠 ${i + 1}/${trap.length} (${trap[i].category}) ===`);
  execFileSync("node", ["scripts/build-trap.mjs"], { cwd: ROOT, stdio: "inherit", env: { ...process.env, WORD_INDEX: String(i) } });
  const scene = JSON.parse(readFileSync(path.join(ROOT, "public", "today-trap.json"), "utf8"));
  const mp4 = path.join(STAGE, `t${i}.mp4`);
  if (existsSync(mp4)) {
    console.log("  (既存staging再利用)");
  } else {
    const comp = await selectComposition({ serveUrl, id: "TrapShort", inputProps: { scene } });
    await renderMedia({ composition: comp, serveUrl, codec: "h264", outputLocation: mp4, inputProps: { scene }, onProgress: ({ progress }) => process.stdout.write(`\r  ${Math.round(progress * 100)}%  `) });
    console.log(" 完了");
  }
  trapItems.push({ type: "罠", title: scene.category, mp4, cap: buildTrapCaption(scene) });
}

// 2) 既存の表/裏 01-32（= ura_seed[0..31]）
const ubFiles = readdirSync(SRC_UB).filter((f) => /^(0[1-9]|[12][0-9]|3[0-2])_.*\.mp4$/.test(f)).sort();
const ubItems = ubFiles.map((f, i) => ({
  type: "表裏",
  title: `${ura[i].category}「${ura[i].front.meaning}」`,
  mp4: path.join(SRC_UB, f),
  capFile: path.join(SRC_UB, f.replace(".mp4", "_キャプション.txt")),
}));

// 3) 投稿順：3本ごとに罠を1本はさむ
const order = [];
let u = 0, t = 0;
for (let pos = 1; u < ubItems.length || t < trapItems.length; pos++) {
  if (pos % 3 === 0 && t < trapItems.length) order.push(trapItems[t++]);
  else if (u < ubItems.length) order.push(ubItems[u++]);
  else if (t < trapItems.length) order.push(trapItems[t++]);
}

// 4) 連番コピー＋スケジュールmd
let md = `# 裏・中国語 投稿スケジュール（全${order.length}本）\n\n`;
md += `- **YouTube**：毎日自動投稿（表/裏）。手動操作は不要。何を投稿したかは リポジトリの \`shorts/posted-log.md\` に自動記録。\n`;
md += `- **Instagram**：この順番で手動投稿。各動画と同名の \`_キャプション.txt\` を貼り付けるだけ。\n`;
md += `- 投稿したら 済 を ☑ に。表/裏と罠クイズが交互（表裏2本ごとに罠1本）。\n\n`;
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
