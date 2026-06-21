// 複数エントリをまとめて「動画＋キャプション」に書き出し、
// ~/Desktop/裏中国語_投稿用/ に投稿用ファイルとして並べる（Business Suiteで予約投稿する用）。
// 使い方: node scripts/batch-posts.mjs            (既定の7本)
//        node scripts/batch-posts.mjs 0,1,3,4     (任意のWORD_INDEX)
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildUraCaption } from "./caption.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTDIR = path.join(process.env.HOME, "Desktop", "裏中国語_投稿用");
mkdirSync(OUTDIR, { recursive: true });

// 既定: 気分と表情がバラけるように1週間分を厳選
const indices = (process.argv[2] || "0,1,3,4,6,8,11").split(",").map((x) => x.trim());

const run = (cmd, args, env = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: { ...process.env, ...env } });

const index = [];
let n = 1;
for (const idx of indices) {
  console.log(`\n=== [${n}/${indices.length}] WORD_INDEX=${idx} ===`);
  run("node", ["scripts/build-ura.mjs"], { WORD_INDEX: idx });
  run("node", ["scripts/render-ura.mjs"]);

  const s = JSON.parse(readFileSync(path.join(ROOT, "public", "today-ura.json"), "utf8"));
  const cap = buildUraCaption(s);
  const nn = String(n).padStart(2, "0");
  const safe = (s.front.meaning || `word${idx}`).replace(/[\/\\:*?"<>|]/g, "");
  const base = path.join(OUTDIR, `${nn}_${safe}の裏`);

  copyFileSync(path.join(ROOT, "out", "ura.mp4"), `${base}.mp4`);
  writeFileSync(
    `${base}_キャプション.txt`,
    `▼タイトル(YouTube用)\n${cap.title}\n\n▼キャプション(Instagram/共通・コピペ用)\n${cap.instagramCaption}\n`
  );
  console.log(`✓ ${base}.mp4`);
  index.push(`${nn}. ${s.category}：「${s.front.meaning}」 → ${s.backs.map((b) => b.hanzi).join(" / ")}`);
  n++;
}

// 投稿カレンダーのたたき台
writeFileSync(
  path.join(OUTDIR, "_投稿リスト.txt"),
  `裏・中国語 投稿用バンドル（${indices.length}本）\n` +
    `Business Suiteで「日時を指定して予約」すれば毎日1本ずつ自動投稿できます。\n\n` +
    index.join("\n") +
    `\n\n各.mp4と同名の_キャプション.txtを貼り付けるだけ。ハッシュタグ込みです。\n`
);
console.log(`\n全${indices.length}本を書き出しました → ${OUTDIR}`);
