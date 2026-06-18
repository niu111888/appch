# 自動投稿のセットアップ手順

毎日の自動投稿には、YouTube と Instagram それぞれの「鍵（認証情報）」が要る。
取った鍵は **GitHub リポジトリの Secrets** に登録する（コードには絶対に書かない）。

> 鍵が無い間も動画の生成・レンダリングは普通に動く（投稿だけスキップ）。
> まず YouTube だけ、あとから Instagram、でもOK。

---

## A. YouTube（所要 15分）

### 1. Google Cloud でプロジェクトとAPIを用意
1. https://console.cloud.google.com/ でプロジェクトを作成
2. 「APIとサービス」→「ライブラリ」で **YouTube Data API v3** を有効化
3. 「OAuth同意画面」を設定（ユーザー種類: 外部／テストユーザーに自分のGoogleアカウントを追加）
4. 「認証情報」→「認証情報を作成」→「OAuthクライアントID」→ 種類は **デスクトップアプリ**
5. 表示される **クライアントID** と **クライアントシークレット** を控える

### 2. refresh_token を取得（このリポジトリのスクリプトで）
```bash
cd shorts
YOUTUBE_CLIENT_ID=さっきのID \
YOUTUBE_CLIENT_SECRET=さっきのシークレット \
node scripts/auth-youtube.mjs
```
表示されたURLをブラウザで開いて許可 → ターミナルに出る **refresh_token** を控える。

### 3. GitHub Secrets に登録
リポジトリの Settings → Secrets and variables → Actions → New repository secret で3つ:
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

---

## B. Instagram（所要 30分・やや手間）

Instagram の自動投稿は **プロアカウント（ビジネス/クリエイター）** と Facebook 連携が必須。
さらに API は「公開URL上の動画」しか受け付けないため、本リポジトリでは
**動画を GitHub Release に上げて、その公開URLを Instagram に渡す**方式にしている
（= この方式を使うには GitHubリポジトリを public にする必要がある）。

### 1. アカウント準備
1. Instagram を**プロアカウント**に切り替える
2. Facebook ページを作り、そのページに Instagram アカウントを連携

### 2. アプリとトークン
1. https://developers.facebook.com/ でアプリを作成（タイプ: ビジネス）
2. 「Instagram Graph API」を追加
3. グラフAPIエクスプローラ等で **長期アクセストークン** を発行
   （権限: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`）
4. 自分の **IG ユーザーID**（`ig-user-id`）を取得

### 3. GitHub Secrets に登録
- `IG_USER_ID`
- `IG_ACCESS_TOKEN`

> ⚠️ Instagram の長期トークンは約60日で失効する。失効したら再発行して Secret を更新する。
> （将来は自動更新スクリプトを足せる。）

---

## C. 投稿時刻を決める

`.github/workflows/daily-short.yml` の `cron` は **UTC**。日本時間 = UTC+9。

| 投稿したい時刻(JST) | cron |
|---|---|
| 朝 9:00 | `0 0 * * *` |
| 昼 12:00 | `0 3 * * *` |
| 夜 21:00 | `0 12 * * *` |

## D. 動作確認

1. すべての Secret を登録
2. GitHub の **Actions** タブ →「Daily Chinese Short」→「Run workflow」で手動実行
3. ログで YouTube/Instagram に上がったか確認 → 問題なければ毎日 cron で自動投稿

最初は `YT_PRIVACY` を `private`（または workflow の env で `unlisted`）にして
出来栄えを確認してから public に切り替えるのが安全。
