const GRAPH = "https://graph.facebook.com/v21.0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Instagram に Reels を投稿する。
 * Instagram Graph API は「公開URLにある動画」しか受け付けないため、
 * videoUrl には公開アクセス可能な mp4 のURLを渡す必要がある。
 * 必要な環境変数: IG_USER_ID / IG_ACCESS_TOKEN
 * 認証情報 or 公開URLが無ければスキップ（DRY RUN）。
 */
export async function uploadInstagramReel({ videoUrl, caption }) {
  const igUserId = process.env.IG_USER_ID;
  const token = process.env.IG_ACCESS_TOKEN;

  if (!igUserId || !token) {
    console.log("[Instagram] 認証情報が無いのでスキップ（DRY RUN）");
    return { skipped: true };
  }
  if (!videoUrl) {
    console.log("[Instagram] 公開動画URL(PUBLIC_VIDEO_URL)が無いのでスキップ");
    return { skipped: true };
  }

  // 1) メディアコンテナ作成
  const createRes = await fetch(`${GRAPH}/${igUserId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "REELS",
      video_url: videoUrl,
      caption,
      share_to_feed: true,
      access_token: token,
    }),
  });
  const created = await createRes.json();
  if (!created.id) throw new Error(`[Instagram] コンテナ作成失敗: ${JSON.stringify(created)}`);
  console.log("[Instagram] コンテナ作成:", created.id, "→ 動画処理を待機中…");

  // 2) 処理完了まで待つ（Reelsはサーバ側エンコードに時間がかかる）
  let ready = false;
  for (let i = 0; i < 40; i++) {
    await sleep(6000);
    const st = await (
      await fetch(`${GRAPH}/${created.id}?fields=status_code,status&access_token=${token}`)
    ).json();
    if (st.status_code === "FINISHED") {
      ready = true;
      break;
    }
    if (st.status_code === "ERROR") throw new Error(`[Instagram] 処理エラー: ${JSON.stringify(st)}`);
    process.stdout.write(`\r[Instagram] 処理中… ${(i + 1) * 6}s`);
  }
  process.stdout.write("\n");
  if (!ready) throw new Error("[Instagram] 処理がタイムアウトしました");

  // 3) 公開
  const pubRes = await fetch(`${GRAPH}/${igUserId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: created.id, access_token: token }),
  });
  const published = await pubRes.json();
  if (!published.id) throw new Error(`[Instagram] 公開失敗: ${JSON.stringify(published)}`);
  console.log("[Instagram] 公開しました:", published.id);
  return { id: published.id };
}
