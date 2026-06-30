import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCaption, buildUraCaption } from "./caption.mjs";
import { uploadYouTube } from "./upload-youtube.mjs";
import { uploadInstagramReel } from "./upload-instagram.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// 裏・中国語(表/裏)があればそれを優先。無ければ従来のフレーズ動画。
const uraPath = path.join(ROOT, "public", "today-ura.json");
let scene, caption, videoPath, label;
if (existsSync(uraPath)) {
  scene = JSON.parse(await readFile(uraPath, "utf8"));
  caption = buildUraCaption(scene);
  videoPath = path.join(ROOT, "out", "ura.mp4");
  label = `${scene.front.hanzi} → ${scene.backs.map((b) => b.hanzi).join("/")}`;
} else {
  scene = JSON.parse(await readFile(path.join(ROOT, "public", "today.json"), "utf8"));
  caption = buildCaption(scene);
  videoPath = path.join(ROOT, "out", "video.mp4");
  label = `${scene.hanzi}（${scene.pinyin}）${scene.meaning}`;
}

console.log(`投稿: ${label}`);

const results = {};
try {
  results.youtube = await uploadYouTube({
    videoPath,
    title: caption.title,
    description: caption.youtubeDescription,
    tags: caption.tags,
    privacy: process.env.YT_PRIVACY || "public",
  });
} catch (e) {
  console.error("[YouTube] 失敗:", e.message);
  results.youtube = { error: e.message };
}

try {
  results.instagram = await uploadInstagramReel({
    videoUrl: process.env.PUBLIC_VIDEO_URL,
    caption: caption.instagramCaption,
  });
} catch (e) {
  console.error("[Instagram] 失敗:", e.message);
  results.instagram = { error: e.message };
}

console.log("結果:", JSON.stringify(results, null, 2));

// 投稿ログを記録（表/裏のYouTube成功時のみ・連番カウンターを前進）
if (existsSync(uraPath) && results.youtube && results.youtube.id) {
  try {
    const logPath = path.join(ROOT, "posted-log.json");
    const uraCount = JSON.parse(readFileSync(path.join(ROOT, "ura_seed.json"), "utf8")).length;
    let log = { nextUra: 0, posts: [] };
    try { log = JSON.parse(readFileSync(logPath, "utf8")); } catch {}
    log.posts = log.posts || [];
    const idx = Number.isInteger(scene.index) ? scene.index : (log.nextUra ?? 0);
    log.posts.push({
      date: new Date().toISOString().slice(0, 10),
      n: log.posts.filter((p) => !String(p.type || "").startsWith("テスト")).length + 1,
      index: idx,
      category: scene.category,
      front: scene.front?.hanzi,
      meaning: scene.front?.meaning,
      backs: scene.backs?.map((b) => b.hanzi).join("/"),
      youtube: results.youtube.url,
    });
    log.nextUra = (((idx + 1) % uraCount) + uraCount) % uraCount;
    writeFileSync(logPath, JSON.stringify(log, null, 2) + "\n");

    // 人間が読む用の一覧（posted-log.md）を再生成
    const md =
      `# YouTube 投稿ログ（裏・中国語 表/裏）\n\n次に投稿する index: **${log.nextUra}**（${uraCount}本でカタログ順に巡回）\n\n| # | 日付 | index | カテゴリ | 表 | YouTube |\n|---|---|---|---|---|---|\n` +
      log.posts.map((p) => `| ${p.n ?? "-"} | ${p.date} | ${p.index ?? "-"} | ${p.category} | ${p.front ?? ""}(${p.meaning ?? ""}) | ${p.youtube ?? ""} |`).join("\n") + "\n";
    writeFileSync(path.join(ROOT, "posted-log.md"), md);
    console.log(`📒 ログ記録: #${log.posts.length} index${idx} → 次は index${log.nextUra}`);
  } catch (e) {
    console.error("ログ記録に失敗:", e.message);
  }
}
