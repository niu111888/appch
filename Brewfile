# Brewfile — このマシンで使っている Homebrew ツール
# 新しいMacで `brew bundle` を実行すると、ここに書いたものが一括で入ります。
# 新しくツールを入れたら、ここにも追記してください（SETUP.md §7 参照）。
#
# 記録時点（2026-06-18）の `brew leaves`（明示インストール）をそのまま反映。

brew "gh"      # GitHub CLI（リポジトリ操作・複数アカウント切替）
brew "mise"    # ランタイム管理（Node などのバージョン管理）
brew "jq"      # JSON処理（スクリプト用）
brew "trash"   # 安全な削除（rm の代わり）

# --- xcodes は Homebrew では入りません（重要） -----------------------------
# このMac環境では `brew install xcodes` がビルド失敗します
# （ソースビルドに Xcode が必要という鶏卵問題）。
# そのため xcodes は GitHub のビルド済みバイナリを手動設置しています。
# bootstrap.sh が自動でやりますが、手動なら:
#   curl -fsSL -o /tmp/xcodes.zip \
#     https://github.com/XcodesOrg/xcodes/releases/download/2.0.2/xcodes.zip
#   (cd /tmp && unzip -o xcodes.zip)
#   install -m 755 /tmp/xcodes /opt/homebrew/bin/xcodes
