import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// venv 内の edge-tts を使う（CI では EDGE_TTS 環境変数で上書き可能）
const EDGE_TTS = process.env.EDGE_TTS || path.join(ROOT, ".venv", "bin", "edge-tts");

/**
 * 中国語テキストを音声合成し、mp3 と字幕(vtt)を書き出す。
 * 字幕の最終タイムスタンプから発話の長さ（秒）を割り出して返す。
 */
export async function synthesize({ text, outMp3, voice = "zh-CN-XiaoxiaoNeural", rate = "-10%" }) {
  const outVtt = outMp3.replace(/\.mp3$/, ".vtt");
  await execFileP(EDGE_TTS, [
    "--voice", voice,
    `--rate=${rate}`,
    "--text", text,
    "--write-media", outMp3,
    "--write-subtitles", outVtt,
  ]);
  const duration = await durationFromVtt(outVtt);
  return { mp3: outMp3, vtt: outVtt, duration };
}

async function durationFromVtt(vttPath) {
  const raw = await readFile(vttPath, "utf8");
  // "00:00:02,022" / "00:00:02.022" 形式のタイムスタンプの最大値＝発話長
  const re = /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/g;
  let m;
  let max = 0;
  while ((m = re.exec(raw))) {
    const sec = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
    if (sec > max) max = sec;
  }
  // 字幕は実音声よりわずかに早く切れるので少しだけ足す
  return max > 0 ? max + 0.25 : 1.5;
}
