# App Store 掲載情報（下書き）

そのまま App Store Connect に貼れる素材。**アプリ名は未確定**なので候補から選んで差し替える。

---

## アプリ名の候補（最大30字）

1. **中文タンゴ** — 中国語「単語(タンゴ)」のもじり。短くて覚えやすい
2. **ハオ単語 −中国語−** — 「好(hǎo)」＋単語
3. **ニーハオ単語帳**
4. **中国語タンゴ HSK単語**
5. **ピンミー 中国語単語**

> 以下では仮名 **「中文タンゴ」** を使用。決まったら一括置換。

---

## 日本語

### サブタイトル（最大30字）
HSK5000語＋通知で続く中国語暗記

### キーワード（カンマ区切り・合計100字以内）
```
中国語,単語,HSK,ピンイン,声調,暗記,単語帳,リスニング,発音,中国語学習,中検,フラッシュカード,通知,語彙
```

### プロモーション用テキスト（最大170字）
HSK1〜6の約5,000語を収録。声調カラー表示・例文・発音つき。忘却曲線の通知が「ちょうど忘れた頃」に出題し、通知から4択クイズにも答えられます。苦手とお気に入りで集中復習。

### 説明（最大4,000字）
中国語の単語を、続けながら自然に覚えられる単語帳アプリです。

■ たっぷり5,068語を最初から収録
HSK1〜6級の語彙に加え、「旅行」「ビジネス」「日常会話」のレッスンを内蔵。インストールしてすぐ始められます。

■ 中国語に特化した学習体験
・ピンインを四声で色分け表示（1声=赤／2声=緑／3声=青／4声=紫）
・各単語に意味・例文・例文訳
・ネイティブ風の音声読み上げで発音もチェック

■ 通知が「勉強」になる
忘却曲線（間隔反復）にもとづいて、ちょうど忘れた頃に通知でリマインド。通知には単語・ピンイン・意味・例文を表示でき、見るだけで復習できます。「答えを隠す思い出しモード」や、通知のボタンで答える「4択クイズモード」も選べます。

■ 自分に合わせて復習
・苦手（間違えた単語）だけを集中復習
・お気に入りに登録してすぐ見返す
・レッスンを選んで目的別に学習
・4択クイズで腕試し
・連続学習日数（ストリーク）とカレンダーのヒートマップでやる気が続く

■ 自分の単語も追加
見つけた単語を登録したり、CSV/テキストでまとめてインポート。お使いのAI（Claude）APIキーを設定すれば、漢字を入れるだけでピンイン・意味・例文を自動補完できます（任意機能）。

■ ホーム画面ウィジェット
今日の復習数や今日の単語をホーム画面に表示（小・中・大サイズ）。

シンプルで見やすいデザイン。ダークモードにも対応しています。

---

## English

### Subtitle (max 30)
5,000 HSK words + smart reminders

### Keywords (max 100 chars)
```
Chinese,vocabulary,HSK,pinyin,tones,flashcards,learn Chinese,Mandarin,spaced repetition,review,quiz
```

### Promotional Text (max 170)
~5,000 HSK words with tone-colored pinyin, examples and audio. Spaced-repetition reminders quiz you right when you’re about to forget — even from the notification itself.

### Description (max 4,000)
Learn and remember Chinese vocabulary, the natural way.

■ 5,068 words built in
All HSK 1–6 vocabulary plus Travel, Business and Daily-conversation lessons. Start the moment you install — no setup needed.

■ Built for Chinese
• Pinyin colored by tone (1=red, 2=green, 3=blue, 4=purple)
• Meaning, example sentence and translation for every word
• Natural text-to-speech to check your pronunciation

■ Notifications that actually teach
Spaced-repetition reminders surface words right when you’re about to forget them. The notification can show the word, pinyin, meaning and example so you learn at a glance — or hide the answer for recall practice, or answer a 4-choice quiz straight from the notification.

■ Review your way
• Focus on weak words you got wrong
• Star favorites for quick review
• Pick a lesson and study by purpose
• Test yourself with multiple-choice quizzes
• Keep your streak going with a calendar heatmap

■ Add your own words
Add words you find, or bulk-import from CSV/text. Set your own Claude API key to auto-fill pinyin, meaning and examples from just the characters (optional).

■ Home Screen widget
See today’s review count and word on your Home Screen (small, medium, large). Clean design with Dark Mode support.

---

## その他の入力項目

- **カテゴリ**：教育（Education） / 副カテゴリ：（任意）参考書（Reference）
- **年齢制限**：4+（不適切コンテンツなし）
- **サポートURL**：例 `https://github.com/niu111888/appch`（または専用ページ）
- **プライバシーポリシーURL**：`PRIVACY.md` を公開してURL化（GitHub Pages 等）
- **輸出コンプライアンス**：独自の暗号化なし（標準HTTPSのみ）→ 免除に該当
- **レビューノート**：「5,068語を内蔵しAPIキー無しで全機能利用可。AI補完は任意で、ユーザー自身のAnthropic APIキー設定時のみ動作。」

## スクリーンショットの撮り方（シミュレータ）

```bash
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcrun simctl io booted screenshot ~/Desktop/shot.png
```
ホーム（レッスン選択）／学習（声調カラー）／4択クイズ／記録（ストリーク＋ヒートマップ）／リマインダー の5枚がおすすめ。
