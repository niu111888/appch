import http from "node:http";
import { URL } from "node:url";
import { readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";

/**
 * YouTube の投稿先チャンネルを（再）認証して GitHub Secrets に保存するヘルパー。
 *
 *   node scripts/auth-youtube.mjs --client ~/Downloads/client_secret_xxx.json
 *   （または YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET を環境変数で渡す）
 *
 * - ブラウザの同意画面で「投稿したいチャンネル（@ura_chinese888 等）」を選ぶ。
 * - 取得した refresh_token は画面に出さず、gh で GitHub Secrets に直接保存する。
 * - readonly 権限で実際の投稿先チャンネルを確認して表示する。
 *
 * 事前: Google Cloud で YouTube Data API v3 を有効化＋OAuth同意画面のテストユーザーに自分を追加。
 */

const args = process.argv.slice(2);
const clientPath = (() => {
  const i = args.indexOf("--client");
  return i >= 0 ? args[i + 1] : process.env.CLIENT_JSON;
})();

let clientId = process.env.YOUTUBE_CLIENT_ID;
let clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
if (clientPath) {
  const j = JSON.parse(readFileSync(clientPath.replace(/^~/, process.env.HOME), "utf8"));
  const c = j.installed || j.web || j;
  clientId = c.client_id;
  clientSecret = c.client_secret;
}
if (!clientId || !clientSecret) {
  console.error("OAuthクライアントが必要です。--client <client_secret.json> か YOUTUBE_CLIENT_ID/SECRET を渡してください。");
  process.exit(1);
}

// 保存先リポジトリ
let repo = "";
try {
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  const m = url.match(/github\.com[:/]([^/]+\/[^/.]+)/);
  repo = m ? m[1] : "";
} catch {}

const PORT = 53682;
const redirectUri = `http://localhost:${PORT}`;
const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    // upload=投稿用 / readonly=投稿先チャンネルの確認用
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
    access_type: "offline",
    prompt: "consent select_account",
  }).toString();

console.log("\n▼ このURLをブラウザで開いて許可してください:");
console.log("  ※ 同意画面では投稿したいチャンネル（@ura_chinese888）を必ず選んでください\n");
console.log(authUrl + "\n");
try { spawnSync("open", [authUrl]); } catch {}

const setSecret = (name, value) => {
  const a = ["secret", "set", name];
  if (repo) a.push("--repo", repo);
  const r = spawnSync("gh", a, { input: value, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`gh secret set ${name} 失敗: ${r.stderr || r.stdout}`);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, redirectUri);
  const code = url.searchParams.get("code");
  if (!code) { res.writeHead(400).end("no code"); return; }
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    });
    const data = await tokenRes.json();
    if (!data.refresh_token) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end("<h2>refresh_tokenが取れませんでした。ターミナルを確認してください。</h2>");
      console.log("\n⚠️ refresh_token が返りませんでした。https://myaccount.google.com/permissions でこのアプリのアクセスを一度削除してから再実行してください。");
      console.log(JSON.stringify({ error: data.error, error_description: data.error_description }, null, 2));
      server.close();
      return;
    }

    // 投稿先チャンネルを確認（readonly）
    const chRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: "Bearer " + data.access_token } });
    const chJson = await chRes.json();
    const ch = chJson.items && chJson.items[0];
    const title = ch ? ch.snippet.title : "(不明)";
    const handle = ch ? (ch.snippet.customUrl || "(ハンドル未設定)") : "(不明)";

    // GitHub Secrets に保存（トークンは画面に出さない）
    setSecret("YOUTUBE_CLIENT_ID", clientId);
    setSecret("YOUTUBE_CLIENT_SECRET", clientSecret);
    setSecret("YOUTUBE_REFRESH_TOKEN", data.refresh_token);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      .end(`<h2>設定しました。投稿先: ${title} (${handle})</h2><p>ターミナルに戻ってください。</p>`);

    console.log("\n✅ GitHub Secrets を更新しました（トークンは表示していません）");
    console.log("   投稿先チャンネル:", title, "/", handle);
    if (repo) console.log("   リポジトリ:", repo);
    if (/NIU|accessories/i.test(handle) || /NIU/i.test(title)) {
      console.log("\n⚠️ まだ NIU チャンネルのようです。同意画面で @ura_chinese888 を選び直して、もう一度実行してください。");
    } else {
      console.log("\n→ 次回の自動投稿（毎朝9時JST）からこのチャンネルに公開投稿されます。");
    }
  } catch (e) {
    res.writeHead(500).end("error");
    console.log("\n⚠️ エラー:", e.message);
  }
  server.close();
});

server.listen(PORT, () => console.log(`（認証待ち: ${redirectUri} で受信します）`));
