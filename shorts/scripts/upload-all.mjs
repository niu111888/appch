import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCaption } from "./caption.mjs";
import { uploadYouTube } from "./upload-youtube.mjs";
import { uploadInstagramReel } from "./upload-instagram.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const scene = JSON.parse(await readFile(path.join(ROOT, "public", "today.json"), "utf8"));
const videoPath = path.join(ROOT, "out", "video.mp4");
const caption = buildCaption(scene);

console.log(`投稿: ${scene.hanzi}（${scene.pinyin}）${scene.meaning}`);

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
