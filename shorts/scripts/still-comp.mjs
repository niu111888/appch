import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, ensureBrowser } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const id = process.argv[2] || "UraShort";
const frames = (process.argv[3] || "30,70,140,200,270,330").split(",").map(Number);

await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id });
console.log("duration:", composition.durationInFrames);
for (const frame of frames) {
  if (frame >= composition.durationInFrames) continue;
  const output = path.join(ROOT, "out", `${id}_${frame}.png`);
  await renderStill({ composition, serveUrl, output, frame, overwrite: true });
  console.log("saved", path.basename(output));
}
