import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, mkdir } from "node:fs/promises";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, ensureBrowser } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

console.log("ブラウザを準備中…");
await ensureBrowser();

const today = JSON.parse(await readFile(path.join(ROOT, "public", "today.json"), "utf8"));

console.log("バンドル中…");
const serveUrl = await bundle({
  entryPoint: path.join(ROOT, "src", "index.ts"),
  publicDir: path.join(ROOT, "public"),
});

const composition = await selectComposition({ serveUrl, id: "PhraseShort" });
console.log(`長さ: ${composition.durationInFrames}フレーム（${(composition.durationInFrames / composition.fps).toFixed(1)}秒）`);

await mkdir(path.join(ROOT, "out"), { recursive: true });
const outputLocation = path.join(ROOT, "out", "video.mp4");

await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation,
  onProgress: ({ progress }) => {
    process.stdout.write(`\rレンダリング ${Math.round(progress * 100)}%   `);
  },
});

console.log(`\n完成: out/video.mp4  （${today.hanzi} / ${today.meaning}）`);
