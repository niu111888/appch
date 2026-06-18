#!/usr/bin/env bash
#
# bootstrap.sh — 新しいMacでこのプロジェクトの開発環境を一発で整える
#
# 使い方:  cd appch && bash bootstrap.sh
#
# 自動でやること: Homebrew確認 / brew bundle / xcodes設置 / mise(Node) / shorts依存(npm+venv)
# 自動でやらないこと（対話やsudoが必要・最後に手順を表示）:
#   Xcode本体のDL, ライセンス同意, iOSプラットフォームDL, ghログイン, gitアカウント設定, 投稿用Secrets
#
# 何度実行してもOK（冪等）。
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

say()  { printf "\n\033[1;34m▶ %s\033[0m\n" "$*"; }
ok()   { printf "  \033[1;32m✓\033[0m %s\n" "$*"; }
warn() { printf "  \033[1;33m!\033[0m %s\n" "$*"; }

# 1) Homebrew -----------------------------------------------------------------
say "Homebrew を確認"
if ! command -v brew >/dev/null 2>&1; then
  warn "Homebrew が未導入です。次を実行してから、もう一度この bootstrap を回してください:"
  echo '    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  exit 1
fi
ok "brew $(brew --version | head -1 | awk '{print $2}')"

# 2) brew bundle（gh, mise, jq, trash）---------------------------------------
say "Brewfile のツールを導入（gh / mise / jq / trash）"
brew bundle --file="$ROOT/Brewfile" && ok "brew bundle 完了"

# 3) xcodes（ビルド済みバイナリを手動設置）------------------------------------
say "xcodes（特定バージョンXcode導入ツール）を確認"
if command -v xcodes >/dev/null 2>&1; then
  ok "xcodes $(xcodes version) は導入済み"
else
  warn "brew では入らないため、ビルド済みバイナリを設置します"
  curl -fsSL -o /tmp/xcodes.zip \
    https://github.com/XcodesOrg/xcodes/releases/download/2.0.2/xcodes.zip \
    && (cd /tmp && unzip -o xcodes.zip >/dev/null) \
    && install -m 755 /tmp/xcodes /opt/homebrew/bin/xcodes \
    && ok "xcodes を /opt/homebrew/bin に設置"
fi

# 4) mise / Node --------------------------------------------------------------
say "mise で Node を用意"
if command -v mise >/dev/null 2>&1; then
  mise install 2>/dev/null || true
  ok "node $(mise exec -- node --version 2>/dev/null || echo '(.tool-versions 参照)')"
else
  warn "mise が見つかりません（brew bundle を確認）"
fi

# 5) shorts サブプロジェクトの依存 -------------------------------------------
if [ -d "$ROOT/shorts" ]; then
  say "shorts/（ショート動画パイプライン）の依存を導入"
  ( cd "$ROOT/shorts"
    if [ -f package-lock.json ]; then
      npm ci && ok "npm 依存(Remotion等)を導入"
    fi
    # edge-tts 用の Python 仮想環境
    if [ ! -d .venv ]; then
      python3 -m venv .venv && ok ".venv を作成"
    fi
    ./.venv/bin/pip install -q --upgrade pip edge-tts && ok "edge-tts を導入"
  )
fi

# 6) 残りの手動ステップを表示 -------------------------------------------------
cat <<'EOF'

────────────────────────────────────────────────────────
ここから先は対話/sudo が必要なので手動でお願いします（SETUP.md 参照）
────────────────────────────────────────────────────────

[A] iOSアプリ(appch/)をビルドするために:
    xcodes install 26.5            # Apple IDサインイン + 約7GB（macOSに合う版を）
    sudo xcodebuild -license accept
    sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
    xcodebuild -runFirstLaunch
    xcodebuild -downloadPlatform iOS   # iOS SDK+シミュレータ 約8.5GB

[B] GitHub アカウント（このプロジェクトは niu111888 を使用・kageは使わない）:
    gh auth login                  # niu111888 でログイン
    # このフォルダのコミット名義（既に設定済みなら不要）:
    git config user.name  "niu111888"
    git config user.email "294673672+niu111888@users.noreply.github.com"

[C] AI補完(appchアプリ内):  アプリの「設定」タブで Claude APIキーを入力
    https://console.anthropic.com/

[D] ショート動画の自動投稿:  shorts/SETUP.md に従い GitHub Secrets を登録
    （YouTube: CLIENT_ID/SECRET/REFRESH_TOKEN, Instagram: IG_USER_ID/ACCESS_TOKEN）

完了後の動作確認（appch/）:
    export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
    xcodebuild -project appch.xcodeproj -scheme appch -sdk iphonesimulator \
      -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath build build
────────────────────────────────────────────────────────
EOF
ok "bootstrap 完了"
