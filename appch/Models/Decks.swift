import Foundation

/// レッスン（デッキ）の定義と並び順。
enum Decks {
    /// 仮想の「すべて」（全レッスン横断）。
    static let all = "すべて"
    /// 自分で追加した単語・知らない単語の保管先。
    static let myWords = "マイ単語"

    /// 既知レッスンの表示順。
    static let order: [String] = [
        "HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6",
        "旅行", "ビジネス", "日常会話", myWords,
    ]

    /// 追加画面で選べるレッスン（マイ単語を先頭に）。
    static let selectableForAdd: [String] = [
        myWords, "HSK1", "HSK2", "HSK3", "HSK4", "HSK5", "HSK6", "旅行", "ビジネス", "日常会話",
    ]

    /// 実在するデッキ一覧（カード集合から）を、既知の並び順で整える。先頭に「すべて」。
    static func available(from decks: Set<String>) -> [String] {
        var ordered = order.filter { decks.contains($0) }
        // 未知のデッキ（手動追加など）も末尾に拾う。
        let extras = decks.subtracting(order).sorted()
        ordered.append(contentsOf: extras)
        // マイ単語は常に選べるようにする。
        if !ordered.contains(myWords) { ordered.append(myWords) }
        return [all] + ordered
    }
}
