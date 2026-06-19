import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HASHTAGS = JSON.parse(readFileSync(path.join(__dirname, "..", "hashtags.json"), "utf8"));

const dedupe = (arr) => [...new Set(arr)];

/** 台本データ(today.json)から各SNS用のタイトル・説明文・ハッシュタグを組み立てる。 */
export function buildCaption(s) {
  const cat = HASHTAGS.categories.find((c) => c.name === s.category);
  const ig = dedupe([...HASHTAGS.common.instagram, ...(cat?.instagram || [])]).slice(0, 30);
  const yt = dedupe([...HASHTAGS.common.youtube, ...(cat?.youtube || [])]);

  const catLabel = s.category ? `【${s.category}】` : "";
  const title = `${s.hanzi}（${s.pinyin}）＝「${s.meaning}」｜デイリー中国語 #shorts`;

  const body =
    `${catLabel}中国語で「${s.meaning}」は ${s.hanzi}（${s.pinyin}）！\n\n` +
    `📝 例文\n${s.example}\n${s.exampleMeaning}\n\n` +
    (s.note ? `💡 ${s.note}\n\n` : "") +
    `毎日ひとこと、リアルな中国語を🥟「デイリー中国語」\n保存して、毎日練習しよう！`;

  const youtubeDescription = `${body}\n\n${yt.join(" ")}`;
  // Instagram はキャプション本文とタグの間に区切りを入れる
  const instagramCaption = `${body}\n.\n.\n.\n${ig.join(" ")}`;

  return { title, youtubeDescription, instagramCaption, tags: dedupe(ig).map((t) => t.replace("#", "")).slice(0, 15) };
}
