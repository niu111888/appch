import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "..", "public", "sfx");
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;

function writeWav(file, samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE((s * 32767) | 0, i * 2);
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8);
  h.write("fmt ", 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
}

const square = (t, f) => (Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1);

// ❌ ブザー（不正解っぽい低音の二段ブッブー）
function buzzer() {
  const dur = 0.4, n = Math.floor(SR * dur), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = t < 0.18 ? 165 : 130; // 二段下がる
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 2.5);
    out[i] = (0.55 * square(t, f) + 0.2 * Math.sin(2 * Math.PI * f * 2 * t)) * env * 0.6;
  }
  return out;
}

// スラング登場のポップ（軽いプリッ）
function pop() {
  const dur = 0.14, n = Math.floor(SR * dur), out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = 480 + 520 * Math.min(1, t / 0.05); // 上がる
    const env = Math.exp(-t * 22);
    out[i] = Math.sin(2 * Math.PI * f * t) * env * 0.5;
  }
  return out;
}

// 登場（裏に切り替わる瞬間のキラッ）
function sparkle() {
  const dur = 0.5, n = Math.floor(SR * dur), out = new Float32Array(n);
  const notes = [880, 1175, 1568];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    notes.forEach((f, k) => {
      const start = k * 0.08;
      if (t >= start) v += Math.sin(2 * Math.PI * f * (t - start)) * Math.exp(-(t - start) * 9);
    });
    out[i] = v * 0.22;
  }
  return out;
}

writeWav(path.join(OUT, "buzzer.wav"), buzzer());
writeWav(path.join(OUT, "pop.wav"), pop());
writeWav(path.join(OUT, "sparkle.wav"), sparkle());
console.log("SFX生成: buzzer.wav / pop.wav / sparkle.wav");
