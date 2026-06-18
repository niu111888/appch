import Foundation
import SwiftData

/// 初回起動時に HSK の初期単語を投入する。
enum SeedLoader {
    /// バンドルされた JSON の 1 件分。deck はファイルに無ければ既定値を使う。
    private struct SeedWord: Codable {
        let deck: String?
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

        // HSK1（deck 指定なし → "HSK1"）と、目的別レッスン（各語に deck あり）を投入。
        load(file: "hsk1_seed", defaultDeck: "HSK1", into: context)
        load(file: "lessons_seed", defaultDeck: Decks.myWords, into: context)
        try? context.save()
    }

    @MainActor
    private static func load(file: String, defaultDeck: String, into context: ModelContext) {
        guard
            let url = Bundle.main.url(forResource: file, withExtension: "json"),
            let data = try? Data(contentsOf: url),
            let words = try? JSONDecoder().decode([SeedWord].self, from: data)
        else {
            return
        }
        for word in words {
            let card = Card(
                deck: word.deck ?? defaultDeck,
                hanzi: word.hanzi,
                pinyin: word.pinyin,
                meaning: word.meaning,
                example: word.example,
                exampleMeaning: word.exampleMeaning
            )
            context.insert(card)
        }
    }
}
