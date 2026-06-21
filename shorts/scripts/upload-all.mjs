import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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
