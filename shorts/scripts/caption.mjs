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

/** 裏・中国語（表/裏フォーマット）用のキャプション。today-ura.json から組む。 */
export function buildUraCaption(s) {
  const net = HASHTAGS.categories.find((c) => c.name === "ネットスラング");
  const extra = ["#裏中国語", "#リアル中国語", "#中国語スラング", "#ネイティブ中国語"];
  const ig = dedupe([...HASHTAGS.common.instagram, ...(net?.instagram || []), ...extra]).slice(0, 30);
  const yt = dedupe([...HASHTAGS.common.youtube, ...(net?.youtube || []), "#裏中国語", "#リアル中国語", "#中国語スラング"]);

  const title = `「${s.front.meaning}」の裏の顔｜裏・中国語 #shorts`;
  const lines = s.backs
    .map((b) => `🔥 ${b.hanzi}（${b.pinyin}）= ${b.meaning}\n　例: ${b.example}（${b.exampleMeaning}）`)
    .join("\n\n");
  const body =
    `教科書では「${s.front.hanzi}」(${s.front.meaning})。\nでも、リアルはこっち👇\n\n` +
    lines +
    `\n\n教科書にないリアルな中国語は「裏・中国語」で！\nプロフのURLからアプリへ📲 保存して使ってね🐼🐰🐷`;

  const youtubeDescription = `${body}\n\n${yt.join(" ")}`;
  const instagramCaption = `${body}\n.\n.\n.\n${ig.join(" ")}`;
  return { title, youtubeDescription, instagramCaption, tags: dedupe(ig).map((t) => t.replace("#", "")).slice(0, 15) };
}

/** 罠クイズ（TrapShort）用のキャプション。today-trap.json から組む。 */
export function buildTrapCaption(s) {
  const net = HASHTAGS.categories.find((c) => c.name === "ネットスラング");
  const extra = ["#裏中国語", "#中国語クイズ", "#中国語あるある", "#日本語と中国語", "#偽中国語に注意"];
  const ig = dedupe([...HASHTAGS.common.instagram, ...(net?.instagram || []), ...extra]).slice(0, 30);
  const yt = dedupe([...HASHTAGS.common.youtube, ...(net?.youtube || []), "#裏中国語", "#中国語クイズ"]);

  const title = `【中国語クイズ】「${s.items[0].hanzi}」の本当の意味、知ってる？｜裏・中国語 #shorts`;
  const lines = s.items
    .map((it) => `❓ ${it.hanzi}（${it.pinyin}）\n　${it.guessLabel ?? "日本語だと"}「${it.jp}」…と思いきや\n　✅ 中国語では「${it.real}」！\n　例: ${it.example}（${it.exampleMeaning}）`)
    .join("\n\n");
  const body =
    `${s.category}\n${s.subtitle}\n\n` +
    lines +
    `\n\n日本語の感覚で読むと事故る中国語、他にもいっぱい👇\n教科書にないリアルな中国語は「裏・中国語」で！\nプロフのURLからアプリへ📲 保存して使ってね🐼🐰🐷`;

  const youtubeDescription = `${body}\n\n${yt.join(" ")}`;
  const instagramCaption = `${body}\n.\n.\n.\n${ig.join(" ")}`;
  return { title, youtubeDescription, instagramCaption, tags: dedupe(ig).map((t) => t.replace("#", "")).slice(0, 15) };
}
