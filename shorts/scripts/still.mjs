import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, ensureBrowser } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

await ensureBrowser();
const serveUrl = await bundle({
  entryPoint: path.join(ROOT, "src", "index.ts"),
  publicDir: path.join(ROOT, "public"),
});
const composition = await selectComposition({ serveUrl, id: "PhraseShort" });

const frames = (process.argv[2] || "140,260,360").split(",").map(Number);
for (const frame of frames) {
  const output = path.join(ROOT, "out", `frame_${frame}.png`);
  await renderStill({ composition, serveUrl, output, frame, overwrite: true });
  console.log("saved", output);
}
