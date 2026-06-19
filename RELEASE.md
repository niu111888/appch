# RELEASE — App Store 公開チェックリスト

このアプリ（中国語単語暗記アプリ）を App Store に出すまでの手順。上から順に進める。

- Bundle ID（アプリ）: `com.genrri.appch`
- Bundle ID（ウィジェット）: `com.genrri.appch.appchWidget`
- App Group: `group.com.genrri.appch`
- 最低OS: iOS 17 / カテゴリ: 教育（Education）

---

## 0. 事前メモ（このアプリ固有）

- **APIキー無しで完全動作**：HSK1〜6＋目的別の **5,068語** を内蔵。AI補完は任意機能。
  → 審査で「機能が薄い(Guideline 4.2)」と判定されにくい。レビューnoteに「AIは任意」と明記する。
- **データ出典**：HSK語彙は [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary)（オープン）。日本語意味・例文はAIで自前生成。README に出典記載済み。
- **通知はローカル通知のみ**（プッシュサーバー無し）。
- ウィジェットの **App Group は有料 Developer Program が必須**（無料アカウント不可）。

---

## 1. Apple Developer Program に加入（必須・年 $99）

1. <https://developer.apple.com/programs/> で加入（個人 or 法人）。
2. 支払い・本人確認の完了を待つ（数時間〜数日）。

## 2. App ID と App Group を登録（Certificates, Identifiers & Profiles）

1. Identifiers で App ID `com.genrri.appch` を登録（Capabilities: App Groups, （任意で）Push なし）。
2. ウィジェット用 App ID `com.genrri.appch.appchWidget` も登録。
3. App Group `group.com.genrri.appch` を登録し、両 App ID に紐付け。
   - Xcode の自動署名（Automatically manage signing）に任せると自動で作られることも多い。

## 3. Xcode で署名（Signing & Capabilities）

1. Xcode → Settings → Accounts に Apple ID を追加。
2. `appch` ターゲット → Team を選択、App Groups に `group.com.genrri.appch` が入っていることを確認。
3. `appchWidgetExtension` ターゲットも同様に Team + App Group。
4. バージョン/ビルド番号：`MARKETING_VERSION`(例 1.0) と `CURRENT_PROJECT_VERSION`(例 1) を確認。

## 4. 表示名・アイコン

1. アプリ表示名を決める（→ `docs/store-listing.md` の候補）。`INFOPLIST_KEY_CFBundleDisplayName` か Product Name に設定。
2. アプリアイコン：`AppIcon`（1024px）設定済み。必要なら各サイズも（Xcode 16 は 1024 単一でOK）。

## 5. App Store Connect でアプリ作成

1. <https://appstoreconnect.apple.com> → My Apps → ＋ → New App。
2. プラットフォーム iOS、名前、主要言語=日本語、Bundle ID=`com.genrri.appch`、SKU 任意。
3. 価格（無料 or 有料）を設定。

## 6. ストア掲載情報を入力（→ `docs/store-listing.md` の下書きを使う）

- 名前 / サブタイトル / 説明 / キーワード / プロモーション文
- サポートURL、マーケティングURL（任意）
- **プライバシーポリシーURL（必須）** → `PRIVACY.md` をGitHub Pages等で公開してURL化
- スクリーンショット：6.7"(iPhone 15/16/17 Pro Max等)と必要サイズ。シミュレータの `xcrun simctl io booted screenshot` で各画面を撮って使える。
- App Privacy（データ収集の質問票）→ `PRIVACY.md` の内容に沿って回答（AI補完でAnthropicに送信する点を申告）。
- 年齢制限（Age Rating）、コンテンツ権利、輸出コンプライアンス（暗号化＝標準HTTPSのみ→該当の免除を申告）。

## 7. ビルドをアップロード

1. Xcode：実行先を「Any iOS Device (arm64)」に。
2. Product → Archive。
3. Organizer → Distribute App → App Store Connect → Upload。
4. 処理完了後、App Store Connect のビルドに表示される。

## 8. TestFlight（任意だが推奨）

- 内部テスター（自分）でまず配布して実機で確認 → 外部テスターにも配れる。
- ここで通知・ウィジェット・AI補完・各レッスンを実機チェック。

## 9. 審査に提出

- ビルドを選択 → レビュー情報（連絡先、**レビューノート**）を記入。
  - レビューノート例：「単語データ5,068語を内蔵し、APIキー無しで全機能が利用できます。AI補完は任意機能で、ユーザー自身のAnthropic APIキーを設定した場合のみ動作します。」
- 提出 → 審査（通常1〜3日）→ 承認 → 公開（手動/自動リリース）。

---

## つまずきやすい点

- **App Group が無料アカウントで provision できない** → 有料加入が前提（§1）。
- **プライバシーポリシーURL未設定で提出不可** → §6 で必ず用意。
- **AIキー方式の説明不足** → レビューノートに「任意機能」と明記（§9）。
- スクショのサイズ不足 → 必須サイズを App Store Connect の指示どおりに。

## 更新時（2回目以降）

`MARKETING_VERSION` を上げて Archive → Upload → 新バージョンを審査提出。
