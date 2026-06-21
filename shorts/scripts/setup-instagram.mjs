import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileP = promisify(execFile);

/**
 * Instagram の認証情報を「チャットに出さず」安全に設定するスクリプト。
 * 値は環境変数で渡し、トークンは画面にも出さない。
 *
 *   IG_APP_ID=xxx IG_APP_SECRET=yyy IG_TOKEN=（グラフAPIエクスプローラで生成した短期ユーザートークン） \
 *   node scripts/setup-instagram.mjs
 *
 * やること: 短期→長期トークン交換 / IGユーザーID自動取得 / GitHub Secrets(IG_USER_ID, IG_ACCESS_TOKEN)登録。
 * 事前条件: @ura_chinese888 がプロアカウント＋Facebookページに連携済み。
 */
const appId = process.env.IG_APP_ID;
const appSecret = process.env.IG_APP_SECRET;
const token = process.env.IG_TOKEN;
const REPO = process.env.GH_REPO || "niu111888/appch";
const V = "v21.0";

if (!appId || !appSecret || !token) {
  console.error("環境変数 IG_APP_ID / IG_APP_SECRET / IG_TOKEN を渡してください。");
  process.exit(1);
}

const get = async (url) => {
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j;
};

try {
  // 1) 短期 → 長期トークン（約60日）
  console.log("長期トークンに交換中…");
  const ex = await get(
    `https://graph.facebook.com/${V}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${encodeURIComponent(token)}`
  );
  const longUser = ex.access_token;

  // 2) IGビジネスアカウントに紐づくページと、その（長寿命の）ページトークン
  console.log("Instagramビジネスアカウントを取得中…");
  const pages = await get(`https://graph.facebook.com/${V}/me/accounts?fields=name,access_token,instagram_business_account&access_token=${longUser}`);
  const page = (pages.data || []).find((p) => p.instagram_business_account);
  if (!page) throw new Error("Instagramビジネスアカウントに紐づくFBページが見つかりません。プロ化＋ページ連携を確認してください。");
  const igId = page.instagram_business_account.id;
  const pageToken = page.access_token;

  // 3) GitHub Secrets に登録（トークンは表示しない）
  console.log("GitHub Secrets に登録中…");
  await execFileP("gh", ["secret", "set", "IG_USER_ID", "--repo", REPO, "--body", igId]);
  await execFileP("gh", ["secret", "set", "IG_ACCESS_TOKEN", "--repo", REPO, "--body", pageToken]);

  console.log("\n✅ Instagram 接続完了");
  console.log("  ページ:", page.name);
  console.log("  IG_USER_ID:", igId, "（登録済）");
  console.log("  IG_ACCESS_TOKEN: 登録済（表示しません）");
  console.log("\n※ 長期トークンは約60日で失効。切れたら同じ手順で再実行を。");
} catch (e) {
  console.error("失敗:", e.message);
  process.exit(1);
}
