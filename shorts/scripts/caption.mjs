/** 台本データ(today.json)から各SNS用のタイトル・説明文・ハッシュタグを組み立てる。 */
export function buildCaption(s) {
  const tagsCore = ["#中国語", "#中国語勉強", "#中国語学習", "#HSK", "#語学学習", "#発音"];

  const title = `${s.hanzi}（${s.pinyin}）＝「${s.meaning}」｜1日1中国語 #shorts`;

  const body =
    `中国語で「${s.meaning}」は ${s.hanzi}（${s.pinyin}）！\n\n` +
    `📝 例文\n${s.example}\n${s.exampleMeaning}\n\n` +
    `毎日1フレーズ、中国語をかわいく覚えよう🐼\n` +
    `アプリ「appch」で全部復習できます。`;

  const youtubeDescription = `${body}\n\n${[...tagsCore, "#shorts", "#中国語フレーズ"].join(" ")}`;

  const instagramCaption =
    `${body}\n\n` +
    [...tagsCore, "#中国語講座", "#中国語フレーズ", "#今日の中国語", "#reels", "#パンダ", "#中国語独学"].join(" ");

  return { title, youtubeDescription, instagramCaption, tags: tagsCore.map((t) => t.replace("#", "")) };
}
