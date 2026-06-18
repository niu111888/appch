# appch — 中国語 単語暗記アプリ

シンプルなUIの中国語単語暗記アプリ（iOS / SwiftUI）。
普通の暗記に加えて、**忘却曲線に沿った通知**で「ちょうど忘れかけた頃」に思い出させます。

## 主な機能

- **HSK1の初期単語50語**を最初から収録（すぐ始められる）
- **単語の自分追加**（漢字を入れて保存）
- **AI補完**：漢字を入れて「AIで補完」を押すと、ピンイン・意味・例文・例文訳をClaudeが自動生成
- **間隔反復（SRS）**：SM-2系の簡易ロジックで復習間隔を自動調整（忘れた/曖昧/覚えた の3択）
- **通知で学習**：漢字＋ピンインだけをロック画面に出し、意味は隠す。通知のボタンから「覚えてた / 忘れた」をその場で回答 → SRSに反映
- **中国語TTS**：単語・例文の発音を再生

## 環境構築・引き継ぎ

別のMacへ移して開発を続けるときは **[SETUP.md](SETUP.md)** を参照（ツール一覧・新デバイスでの再開手順・Xcodeバージョン問題の回避策をまとめた引き継ぎ書）。

## 動かし方

1. **Xcodeをインストール**（無料）。macOSのバージョンで入れられる版が変わるので [SETUP.md §4](SETUP.md) を参照。※App Storeは最新版しか出せず、macOSが古いと弾かれます。
2. `appch.xcodeproj` をXcodeで開く。
3. 上部のスキームで iPhone シミュレータ（または接続した実機）を選ぶ。
4. ▶︎（Run）を押す。

### AI補完を使うには

1. アプリの「設定」タブを開く。
2. 「AI補完（Claude API）」に Claude の APIキー（`sk-ant-...`）を入力 → 保存。
3. ホーム右上の「＋」→ 漢字を入力 →「AIで補完」。

APIキーは [Anthropic Console](https://console.anthropic.com/) で発行できます。キーは端末内（UserDefaults）にのみ保存されます。
補完モデルは安価・高速な Haiku（`claude-haiku-4-5-20251001`）を既定にしています。`appch/Services/AIService.swift` の `model` で変更可。

### 通知を試すには

- 初回起動で通知の許可を求められます → 許可。
- 「設定」タブで 1日の回数・時間帯を調整できます。
- シミュレータでも通知は届きます（ロック画面 or バナー）。実機のほうが体験は自然です。

## 構成

```
appch/
├── appchApp.swift              # エントリ、ModelContainer、通知デリゲート設定
├── Models/
│   └── Card.swift              # 単語＋SRSデータ、SM-2ロジック
├── Services/
│   ├── AIService.swift         # Claude APIで単語補完
│   ├── NotificationManager.swift # 通知のスケジュール＆回答処理
│   ├── Speaker.swift           # 中国語TTS
│   └── SeedLoader.swift        # 初回のHSK投入
├── Views/
│   ├── RootView.swift          # タブ
│   ├── HomeView.swift          # 今日の復習・単語一覧
│   ├── StudyView.swift         # カード学習
│   ├── AddWordView.swift       # 追加＋AI補完
│   └── SettingsView.swift      # APIキー・通知設定
└── Resources/
    └── hsk1_seed.json          # 初期単語データ
```

## 今後のアイデア（壁打ちの続き）

- 声調の色分け表示（1声=赤…）
- 通知から長押しで4択クイズ
- HSK2〜6級のデッキ追加 / CSV一括インポート
- 連続学習日数（ストリーク）やヒートマップ
- 手書き入力・カメラOCRで単語登録
