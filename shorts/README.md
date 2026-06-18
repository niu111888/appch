# appch-shorts — 中国語フレーズ・ショート動画 自動生成

アプリ `appch` と**同じ単語データ**（`../appch/Resources/hsk1_seed.json`）から、
中国語フレーズを教える縦型ショート動画を作り、YouTube Shorts / Instagram Reels に毎日自動投稿する。

```
hsk1_seed.json ──▶ ① 台本+音声生成 ──▶ ② 動画レンダリング ──▶ ③ 自動投稿
   (アプリと共有)     build-today.mjs        Remotion             upload-all.mjs
```

## 仕組み

- **動画エンジン**: Remotion（Reactで動画を組む。`src/PhraseShort.tsx` が本体）
- **音声**: edge-tts（Microsoftのネイティブ中国語音声・無料。`zh-CN-XiaoxiaoNeural`）
- **マスコット**: パンダ（`src/components/Mascot.tsx`。揺れ＋瞬き）
- **毎日実行**: GitHub Actions（`../.github/workflows/daily-short.yml`）

## 必要なもの（初回だけ）

```bash
# 1) Node の依存
npm install

# 2) edge-tts（Python）。このフォルダ内に venv を作る
python3 -m venv .venv
./.venv/bin/pip install edge-tts
```

## 使い方（ローカル）

```bash
# 今日の単語で 台本+音声 を作る
npm run build

# 動画をレンダリング → out/video.mp4
npm run render

# 上の2つをまとめて
npm run today

# プレビュー（ブラウザでリアルタイムに編集）
npm run studio
```

- 単語を指定して試す: `WORD_INDEX=2 npm run build`（0始まり。`hsk1_seed.json` の順）
- 何も指定しなければ「日付ベースで毎日ひとつずつ」進む。

## カスタマイズ

| 変えたいもの | 場所 |
|---|---|
| 声・読み速度・フックの文言 | `config.json` |
| 色・レイアウト・各パートの長さ | `src/PhraseShort.tsx`（先頭の `C` と `T`） |
| マスコットの見た目 | `src/components/Mascot.tsx` |
| キャプション・ハッシュタグ | `scripts/caption.mjs` |
| 投稿時刻 | `../.github/workflows/daily-short.yml` の `cron` |

## 自動投稿の設定

YouTube / Instagram のトークン取得と GitHub Secrets の登録は **[SETUP.md](SETUP.md)** を参照。
認証情報が無い間は投稿はスキップされ、動画生成だけ動く（DRY RUN）。
