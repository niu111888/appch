import Foundation
import SwiftData

/// 初回起動時に HSK の初期単語を投入する。
enum SeedLoader {
    /// バンドルされた JSON の 1 件分。
    private struct SeedWord: Codable {
        let hanzi: String
        let pinyin: String
        let meaning: String
        let example: String
        let exampleMeaning: String
    }

    @MainActor
    static func seedIfNeeded(container: ModelContainer) async {
        let context = container.mainContext
        // すでにカードがあれば何もしない。
        let count = (try? context.fetchCount(FetchDescriptor<Card>())) ?? 0
        guard count == 0 else { return }

        guard
            let url = Bundle.main.url(forResource: "hsk1_seed", withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let words = try? JSONDecoder().decode([SeedWord].self, from: data)
        else {
            return
        }

        // 新規カードは少しずつ出したいので、登録時点ですべて「今すぐ復習可能」にしておく。
        for word in words {
            let card = Card(
                hanzi: word.hanzi,
                pinyin: word.pinyin,
                meaning: word.meaning,
                example: word.example,
                exampleMeaning: word.exampleMeaning
            )
            context.insert(card)
        }
        try? context.save()
    }
}
