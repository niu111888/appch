import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";

/**
 * YouTube に動画をアップロードする（Shorts は縦動画＋#shorts で自動判定）。
 * 必要な環境変数:
 *   YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN
 * 認証情報が無ければスキップする（DRY RUN）。
 */
export async function uploadYouTube({ videoPath, title, description, tags = [], privacy = "public" }) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.log("[YouTube] 認証情報が無いのでスキップ（DRY RUN）");
    console.log("          title:", title);
    return { skipped: true };
  }

  const accessToken = await refreshAccessToken({ clientId, clientSecret, refreshToken });

  const metadata = {
    snippet: { title, description, tags, categoryId: "27" }, // 27 = Education
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
  };

  const size = (await stat(videoPath)).size;

  // 1) resumable セッションを開始
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(size),
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(metadata),
    }
  );
  if (!initRes.ok) throw new Error(`[YouTube] セッション開始失敗: ${initRes.status} ${await initRes.text()}`);
  const uploadUrl = initRes.headers.get("location");
  if (!uploadUrl) throw new Error("[YouTube] アップロードURLが取得できませんでした");

  // 2) 本体をアップロード
  const fileBuffer = await readFile(videoPath);
  const upRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(size) },
    body: fileBuffer,
  });
  if (!upRes.ok) throw new Error(`[YouTube] アップロード失敗: ${upRes.status} ${await upRes.text()}`);
  const result = await upRes.json();
  const url = `https://youtube.com/shorts/${result.id}`;
  console.log("[YouTube] 公開しました:", url);
  return { id: result.id, url };
}

async function refreshAccessToken({ clientId, clientSecret, refreshToken }) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`[YouTube] トークン更新失敗: ${JSON.stringify(data)}`);
  return data.access_token;
}

// createReadStream は将来チャンク分割アップロードに使う想定（現状は一括）。
void createReadStream;
