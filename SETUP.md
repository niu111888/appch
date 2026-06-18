# SETUP — 開発環境の記録（新しいデバイスでもこれを見れば始められる）

> このファイルは「環境の引き継ぎ書」です。**`appch` フォルダごと新しいMacにコピー** → この手順を上から実行すれば、同じ環境で開発を再開できます。
> 何か新しいツールを入れたり設定を変えたら、**必ずこのファイルに追記**してください（末尾の「更新ルール」参照）。

最終更新: 2026-06-18

---

## 1. このプロジェクトは何か

- **appch** — 中国語の単語暗記アプリ（iOS / SwiftUI）。
- 詳細・機能・構成は [README.md](README.md) を参照。
- 開発はすべて **Xcode + Swift**。外部パッケージ依存なし（Swift Package も未使用）。

---

## 2. 必要なもの（ツール一覧）

| ツール | 用途 | 必須? | 備考 |
|---|---|---|---|
| **Mac（Apple Silicon 推奨）** | 開発機 | ✅ | iOSアプリのビルドにはMacが必須 |
| **macOS** | OS | ✅ | Xcodeのバージョン要件に直結（→ §4） |
| **Xcode** | iOSアプリのビルド・実行・シミュレータ | ✅ | **これが本体。これさえ入れば開発できる** |
| **Command Line Tools** | swift / git など | ✅ | Xcodeを入れると同梱される |
| Homebrew | ツール導入の入口 | 推奨 | `xcodes` 等のインストールに使う |
| xcodes | 特定バージョンのXcodeを入れる | 推奨 | App Storeが最新版しか出せない問題の回避（→ §4） |
| git | バージョン管理 | 推奨 | まだこのプロジェクトはGit未初期化（→ §6） |

> Node.js（mise経由）も現在の開発機には入っていますが、**このiOSアプリには不要**です。

---

## 3. 新しいMacでの再開手順（ブートストラップ）

```bash
# 0) この appch フォルダを新しいMacにコピーする（USB / クラウド / git のいずれか）

# 1) Homebrew を入れる（未導入なら）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2) このフォルダ内で、記録したツールを一括インストール
cd /path/to/appch
brew bundle            # Brewfile を読んで xcodes 等を入れる

# 3) Xcode を入れる（§4 を必ず読む — macOSバージョンで入れる版が変わる）
xcodes install --latest    # ただし macOSが古いと失敗する。その場合は §4 の方法で特定版を指定

# 4) コマンドラインを Xcode 本体に向ける
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -runFirstLaunch

# 5) プロジェクトを開いて実行
open appch.xcodeproj
# Xcodeで iPhoneシミュレータを選んで ▶︎（Run）
```

---

## 4. ⚠️ Xcodeのバージョン問題（重要・つまずきポイント）

**Xcodeは「使っているmacOSのバージョン」によって入れられる最大版が決まります。**
App Storeは常に*最新のXcode*しか出さないため、macOSが古いと「バージョンが低くてダウンロードできない」と弾かれます。**これは故障ではなく仕様です。**

対応バージョン（2026-06 時点）:

| macOS | 入れられる最大Xcode |
|---|---|
| Sonoma 14.5 | **Xcode 16.2** |
| Sequoia 15.5+ | Xcode 16.3 以降 |

出典: [Apple Developer — Xcode Support](https://developer.apple.com/support/xcode/)

### 古いmacOSで特定版のXcodeを入れる方法（App Storeを使わない）

**方法A: xcodes CLI（おすすめ・Homebrewが必要）**
```bash
brew install xcodes
xcodes list                 # 入れられるバージョン一覧
xcodes install 16.2         # macOS 14.5 ならこれ
```
（無料のApple IDでのサインインを求められます）

**方法B: 手動ダウンロード**
1. <https://developer.apple.com/download/all/> にApple IDでログイン
2. 該当バージョンのXcode（例: Xcode 16.2）の `.xip` を落とす
3. ダブルクリックで展開 → `Applications` に移動

**方法C: macOSを上げる**
- Apple Silicon機なら最新macOSへ更新できることが多い。更新後はApp Storeの最新Xcodeでよい。
- ※OS更新は他アプリへの影響もあるので各自判断で。

---

## 5. シークレット・設定（リポジトリには入れないもの）

- **Claude APIキー**（AI補完機能用）
  - コードには含めない。アプリの「設定」タブで入力 → 端末内（UserDefaults）に保存される。
  - 新デバイスでは**入れ直しが必要**。発行: <https://console.anthropic.com/>
  - 使用モデル: `claude-haiku-4-5-20251001`（`appch/Services/AIService.swift` で変更可）

---

## 6. バージョン管理（まだ未設定 → 引っ越しを楽にするなら推奨）

このプロジェクトはまだGitリポジトリになっていません。デバイス間の移動を楽にするなら、Git化してGitHub等に置くのが最も確実です。

```bash
cd /path/to/appch
git init
git add .
git commit -m "Initial commit"
# 任意: GitHubにpush（gh CLI など）
```

→ こうすると新デバイスでは `git clone` 一発でこのファイル群（SETUP.md含む）が手に入ります。

---

## 7. このファイルの更新ルール（大事）

開発を進める中で以下が起きたら、**その都度ここに追記**してください。新デバイスでの再現性はこのファイルの鮮度で決まります。

- 新しいツール／ライブラリを入れた → §2 の表 と `Brewfile` に追加
- Swift Package など依存を追加した → ここに記載（パッケージ名・用途）
- ビルド設定・必要なmacOS/Xcodeバージョンが変わった → §4 を更新
- 新しいAPIキーやサービスを使い始めた → §5 に追加（キー本体は書かない）
- 「最終更新」日付を更新

---

## 8. 現在の開発機スナップショット（記録: 2026-06-18）

| 項目 | 値 |
|---|---|
| 機種 | Apple M3（arm64） |
| macOS | 14.5 (Sonoma, build 23F79) |
| Xcode | **未インストール**（現状 Command Line Tools のみ） |
| Swift | 6.0.3（Command Line Tools 同梱） |
| Homebrew | 6.0.1（/opt/homebrew） |
| git | 2.39.5（Apple Git） |
| Node | v24.16.0（mise経由・このアプリには不要） |

> 現状この機ではXcode未導入のため、まだ実機/シミュレータでのビルドはできていない。
> macOS 14.5 なので Xcode 16.2 を §4 の方法で入れるのが次の一手。
