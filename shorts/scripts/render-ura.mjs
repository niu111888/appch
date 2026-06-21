import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderMedia, ensureBrowser } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

console.log("準備中…");
await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "UraShort" });
console.log(`長さ: ${composition.durationInFrames}フレーム（${(composition.durationInFrames / composition.fps).toFixed(1)}秒）`);
const outputLocation = path.join(ROOT, "out", "ura.mp4");
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  outputLocation,
  onProgress: ({ progress }) => process.stdout.write(`\r${Math.round(progress * 100)}%  `),
});
console.log("\n完成: out/ura.mp4");
