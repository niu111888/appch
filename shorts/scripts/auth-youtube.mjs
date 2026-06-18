import http from "node:http";
import { URL } from "node:url";

/**
 * YouTube の refresh_token を一度だけ取得するためのヘルパー。
 *   YOUTUBE_CLIENT_ID=xxx YOUTUBE_CLIENT_SECRET=yyy node scripts/auth-youtube.mjs
 * を実行すると、ブラウザで開くURLが表示される。許可すると refresh_token が表示されるので、
 * それを GitHub Secrets（YOUTUBE_REFRESH_TOKEN）に保存する。
 *
 * 事前準備: Google Cloud Console で OAuth クライアント（種類: デスクトップアプリ）を作成し、
 * YouTube Data API v3 を有効化しておくこと。詳細は SETUP.md 参照。
 */
const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const PORT = 53682;
const redirectUri = `http://localhost:${PORT}`;

if (!clientId || !clientSecret) {
  console.error("YOUTUBE_CLIENT_ID と YOUTUBE_CLIENT_SECRET を環境変数で渡してください。");
  process.exit(1);
}

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload",
    access_type: "offline",
    prompt: "consent",
  }).toString();

console.log("\n▼ このURLをブラウザで開いて許可してください:\n");
console.log(authUrl + "\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("no code");
    return;
  }
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const data = await tokenRes.json();
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end("<h2>取得しました。ターミナルに戻ってください。</h2>");
  if (data.refresh_token) {
    console.log("\n✅ refresh_token（これを YOUTUBE_REFRESH_TOKEN に保存）:\n");
    console.log(data.refresh_token + "\n");
  } else {
    console.log("\n⚠️ refresh_token が返りませんでした。Google側で一度アクセス権を取り消してから再実行してください。");
    console.log(JSON.stringify(data, null, 2));
  }
  server.close();
});

server.listen(PORT, () => console.log(`（認証待ち: ${redirectUri} で受信します）`));
