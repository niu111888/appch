import { readFile } from "node:fs/promises";
import { splitPinyin, toneOf } from "../src/tone.mjs";

const words = JSON.parse(await readFile(new URL("../../appch/Resources/hsk1_seed.json", import.meta.url), "utf8"));
for (const w of words) {
  const syl = splitPinyin(w.pinyin);
  const tones = syl.map(toneOf);
  console.log(`${w.hanzi}\t${w.pinyin}\t→ ${syl.join(" / ")}  [${tones.join(",")}]`);
}
