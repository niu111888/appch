# SETUP — 開発環境の記録（新しいデバイスでもこれを見れば始められる）

> このファイルは「環境の引き継ぎ書（マスター索引）」です。**リポジトリごと新しいMacにコピー（または `git clone`）** → この手順を上から実行すれば、同じ環境で開発を再開できます。
> 何か新しいツールを入れたり設定を変えたら、**必ずこのファイルに追記**してください（§7 の「更新ルール」参照）。

最終更新: 2026-06-18

---

## 1. このプロジェクトは何か（2部構成）

このリポジトリには2つのサブプロジェクトが入っています。

| フォルダ | 中身 | 主な技術 | 個別ドキュメント |
|---|---|---|---|
| **`appch/`** | 中国語の単語暗記アプリ（iOS） | Xcode / SwiftUI / SwiftData | [README.md](README.md) |
| **`shorts/`** | 単語から短尺動画を自動生成・毎日投稿 | Node + Remotion / Python(edge-tts) / GitHub Actions | [shorts/README.md](shorts/README.md), [shorts/SETUP.md](shorts/SETUP.md) |

- iOSアプリ本体は外部パッケージ依存なし（Swift Package 未使用）。
- `shorts/` は npm 依存（Remotion）＋ Python仮想環境（edge-tts）で動く。

---

## 2. 必要なもの（ツール一覧・このマシンの実態）

記録時点の `brew leaves`（明示インストール）＝ **gh / mise / jq / trash**。Xcode と xcodes は別管理。

| ツール | 用途 | 使う対象 | 入れ方 |
|---|---|---|---|
| **Mac（Apple Silicon）** | 開発機 | 両方 | — |
| **macOS** | OS | 両方 | Xcodeのバージョン要件に直結（→ §4） |
| **Xcode + iOSプラットフォーム** | iOSビルド・実行・シミュレータ | appch | `xcodes`（→ §3,§4）。iOS SDKは別DL |
| **xcodes** | 特定版Xcodeの導入 | appch | **brew不可**・ビルド済みバイナリを手動設置（→ §4 / `bootstrap.sh`） |
| **Homebrew** | ツール導入の入口 | 両方 | 公式インストーラ |
| **gh** | GitHub操作・複数アカウント切替 | 両方 | `brew` |
| **mise** | Node等のバージョン管理 | shorts | `brew` |
| **Node**（mise経由） | Remotion 実行 | shorts | `mise install`（`shorts/.tool-versions` で版固定） |
| **Python3 + edge-tts** | 音声合成 | shorts | `python3 -m venv .venv && pip install edge-tts` |
| **jq / trash** | スクリプト補助・安全な削除 | 補助 | `brew` |
| **git** | バージョン管理 | 両方 | CLT同梱（→ §6） |

---

## 3. 新しいMacでの再開手順（ブートストラップ）

**いちばん簡単な方法：付属スクリプトを実行**（自動化できる所は自動、対話/sudoが要る所は手順を表示）。

```bash
git clone https://github.com/niu111888/appch.git   # または フォルダごとコピー
cd appch
bash bootstrap.sh        # Homebrew確認 / brew bundle / xcodes設置 / mise(Node) / shorts依存 を自動化
```

`bootstrap.sh` 実行後に残る手動ステップ（スクリプトが最後に一覧表示します）:

```bash
# A) iOS開発の土台（Apple ID + sudo が必要）
xcodes install 26.5                 # macOSに合う版を（→ §4）。約7GB
sudo xcodebuild -license accept
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS    # iOS SDK+シミュレータ 約8.5GB

# B) GitHub（→ §6。このプロジェクトは niu111888 を使う）
gh auth login

# C) アプリのAI補完キー / D) 自動投稿のSecrets → §5
```

> Homebrew が未導入なら先に: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

---

## 3.5 ⭐ ビルド＆実行（実証済みコマンド・GUIなしでOK）

`sudo` を使えない場合でも、`DEVELOPER_DIR` を指定すれば `xcode-select` を切り替えずにビルドできる。
以下は 2026-06-18 にこの環境で実際に通った手順。

```bash
cd /path/to/appch
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer

# ビルド（iPhone 17 シミュレータ向け）
xcodebuild -project appch.xcodeproj -scheme appch -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,name=iPhone 17' \
  -derivedDataPath build -configuration Debug build

# シミュレータ起動 → インストール → 起動
xcrun simctl boot "iPhone 17"          # 既に起動済みならエラーになるが無視でOK
xcrun simctl bootstatus "iPhone 17" -b # 起動完了まで待つ
open -a Simulator                       # 画面を表示
xcrun simctl install booted "build/Build/Products/Debug-iphonesimulator/appch.app"
xcrun simctl launch booted com.genrri.appch

# スクリーンショット（GUIなしで画面を画像保存）
xcrun simctl io booted screenshot /tmp/appch.png
```

つまずきメモ：
- `xcodebuild` が「iOS XX.X is not installed」と言ったら → `xcodebuild -downloadPlatform iOS`（約8.5GB）。
- `Multiple commands produce ... Info.plist` は解決済み（空のInfo.plistを削除し `GENERATE_INFOPLIST_FILE=YES` に一本化）。同種が再発したら同じ方針で。
- バンドルID: `com.genrri.appch`（`project.pbxproj` の `PRODUCT_BUNDLE_IDENTIFIER`）。

---

## 4. ⚠️ Xcodeのバージョン問題（重要・つまずきポイント）

**Xcodeは「使っているmacOSのバージョン」によって入れられる最大版が決まります。**
App Storeは常に*最新のXcode*しか出さないため、macOSが古いと「バージョンが低くてダウンロードできない」と弾かれます。**これは故障ではなく仕様です。**

- **現在の開発機は macOS 26.5.1 → Xcode 26.5 を導入済み**（これで問題なくビルドできている）。
- 新マシンの macOS に合う Xcode 版は毎回ここで確認 → [Apple Developer — Xcode Support](https://developer.apple.com/support/xcode/)。
- macOSが古くて最新Xcodeが入らない場合は、`xcodes install <版>` で**そのmacOSに合う版**を指定する（例: macOS 14.5 なら Xcode 16.2 が上限だった）。

### ⚠️ xcodes は brew では入らない（このマシンの実績）

`brew install xcodes` は**ソースビルドに失敗**します（ビルドにXcodeが要る鶏卵問題）。
そのため **GitHubのビルド済みバイナリを手動設置**しています（`bootstrap.sh` が自動化）。手動なら:

```bash
curl -fsSL -o /tmp/xcodes.zip \
  https://github.com/XcodesOrg/xcodes/releases/download/2.0.2/xcodes.zip
(cd /tmp && unzip -o xcodes.zip)
install -m 755 /tmp/xcodes /opt/homebrew/bin/xcodes
xcodes version            # 2.0.2 が出ればOK
```

### Xcode本体を入れる

```bash
xcodes list               # 入れられるバージョン一覧
xcodes install 26.5       # macOSに合う版を指定（Apple IDサインイン + 約7GB）
```
別解：<https://developer.apple.com/download/all/> から `.xip` を手動DLしてもよい。

---

## 5. シークレット・設定（リポジトリには入れないもの）

| シークレット | 用途 | 置き場所 | 新デバイスでの扱い |
|---|---|---|---|
| **Claude APIキー** | appchアプリのAI補完 | アプリ「設定」タブ → 端末内(UserDefaults) | 入れ直し。発行: <https://console.anthropic.com/> |
| **YouTube**（CLIENT_ID/SECRET/REFRESH_TOKEN） | shorts 自動投稿 | **GitHub リポジトリ Secrets** | 一度登録すればクラウド側に残る |
| **Instagram**（IG_USER_ID/ACCESS_TOKEN） | shorts 自動投稿 | **GitHub リポジトリ Secrets** | 同上。トークンは約60日で失効→再発行 |

- appchの使用モデル: `claude-haiku-4-5-20251001`（`appch/Services/AIService.swift` で変更可）。
- 投稿系シークレットの取得手順は **[shorts/SETUP.md](shorts/SETUP.md)** に詳細あり。コードには絶対に書かない（`shorts/.gitignore` で `.env`/`token*.json` 等を除外済み）。

---

## 6. バージョン管理と GitHub アカウント

このリポジトリは **Git管理済み**。GitHub: <https://github.com/niu111888/appch>（public）。新デバイスは `git clone` 一発で全部入る。

### ⚠️ アカウントは niu111888 を使う（kage20251022 は使わない）

- `gh` には2アカウント登録されている：**niu111888（アクティブ・これを使う）** と kage20251022（非アクティブ）。
- 切替: `gh auth switch` ／ 確認: `gh auth status`。
- 新マシンでは `gh auth login` で **niu111888** にログインする。

### git の名義は niu111888 に統一済み

- **グローバル名義を niu111888 に設定済み**（`user.name=niu111888` / `user.email=294673672+niu111888@users.noreply.github.com`）。新しく別フォルダで `git init` しても niu111888 名義になる。
- このappchフォルダはローカル設定でも同じ名義に固定済み。

**新マシンでは同じ設定を入れ直す**（`git config --global` は機械ごとの設定なので clone では引き継がれない）:

```bash
git config --global user.name  "niu111888"
git config --global user.email "294673672+niu111888@users.noreply.github.com"
git config --global user.email   # ← niu111888... が出ればOK
```

> kage20251022 名義は使わない方針。もし将来フォルダ別に名義を出し分けたくなったら `includeIf` を使う。

---

## 7. このファイルの更新ルール（大事）

開発を進める中で以下が起きたら、**その都度ここに追記**してください。新デバイスでの再現性はこのファイルの鮮度で決まります。

- 新しい brew ツールを入れた → §2 の表・`Brewfile`・`bootstrap.sh` に追加
- npm/Python/Swift Package など依存を追加した → ここ＋該当の `package.json`/`requirements`/`bootstrap.sh` に反映
- ビルド設定・必要なmacOS/Xcodeバージョンが変わった → §4 と §8 を更新
- 新しいAPIキーやサービスを使い始めた → §5 に追加（キー本体は書かない）
- Node等のバージョンを上げた → `shorts/.tool-versions` を更新
- 「最終更新」日付を更新

---

## 8. 現在の開発機スナップショット（記録: 2026-06-18 更新）

| 項目 | 値 |
|---|---|
| 機種 | Apple M3（arm64） |
| macOS | **26.5.1（build 25F80）** |
| Xcode | **26.5 (17F42)**（`/Applications/Xcode.app`、xcodes経由） |
| iOSプラットフォーム | iOS 26.5 Simulator (23F77) 導入済み |
| Swift | 6.3.2（Xcode同梱） |
| Homebrew | 6.0.2（/opt/homebrew） |
| brew leaves | gh, mise, jq, trash |
| xcodes | 2.0.2（ビルド済みバイナリを /opt/homebrew/bin に手動設置・brew管理外） |
| mise / Node | mise 2026.5.18 / node 24.16.0 |
| Python(shorts) | 3.14.5 venv + edge-tts 7.2.8 |
| git | 2.50.1（Apple Git）／名義=niu111888（グローバル・ローカルとも統一済み） |

> ✅ **iPhone 17 シミュレータで appch のビルド・起動・動作確認まで完了**（HSK50語の投入、ホーム/単語一覧/通知許可ダイアログを確認）。
> ✅ shorts は npm依存＋Python venv(edge-tts) を導入済み・動画生成可（投稿はSecrets登録待ち→ shorts/SETUP.md）。
