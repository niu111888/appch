import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill, ensureBrowser } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
// iOS アプリの AppIcon 置き場
const OUT = path.resolve(ROOT, "..", "appch", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-1024.png");

await ensureBrowser();
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src", "index.ts"), publicDir: path.join(ROOT, "public") });
const composition = await selectComposition({ serveUrl, id: "AppIcon" });
await renderStill({ composition, serveUrl, output: OUT, frame: 0, overwrite: true });
console.log("AppIcon 書き出し:", path.relative(path.resolve(ROOT, ".."), OUT));
