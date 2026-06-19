import Foundation
import SwiftData

/// 1単語 = 1カード。学習進捗（SRS）もここに保持する。
@Model
final class Card {
    /// 一意な識別子（通知からカードを特定するのに使う）。
    @Attribute(.unique) var id: UUID
    /// 所属レッスン（デッキ）。例: "HSK1" / "旅行" / "マイ単語"
    var deck: String = "HSK1"
    /// お気に入り。
    var isFavorite: Bool = false
    /// 漢字（簡体字）。例: 苹果
    var hanzi: String
    /// ピンイン（声調記号つき）。例: píngguǒ
    var pinyin: String
    /// 日本語の意味。例: りんご
    var meaning: String
    /// 例文（中国語）。例: 我喜欢吃苹果。
    var example: String
    /// 例文の日本語訳。
    var exampleMeaning: String

    // MARK: - SRS (SM-2 系の簡易版)

    /// 復習予定日。これが今日以前なら「期限切れ＝復習対象」。
    var dueDate: Date
    /// 次の復習までの間隔（日）。
    var intervalDays: Double
    /// 易しさ係数。大きいほど間隔が伸びやすい。SM-2 の初期値 2.5。
    var easeFactor: Double
    /// 連続正解回数。
    var reps: Int
    /// つまずいた回数（統計用）。
    var lapses: Int
    /// 登録日時。
    var createdAt: Date

    init(
        id: UUID = UUID(),
        deck: String = "HSK1",
        hanzi: String,
        pinyin: String = "",
        meaning: String = "",
        example: String = "",
        exampleMeaning: String = "",
        dueDate: Date = .now,
        intervalDays: Double = 0,
        easeFactor: Double = 2.5,
        reps: Int = 0,
        lapses: Int = 0,
        createdAt: Date = .now
    ) {
        self.id = id
        self.deck = deck
        self.hanzi = hanzi
        self.pinyin = pinyin
        self.meaning = meaning
        self.example = example
        self.exampleMeaning = exampleMeaning
        self.dueDate = dueDate
        self.intervalDays = intervalDays
        self.easeFactor = easeFactor
        self.reps = reps
        self.lapses = lapses
        self.createdAt = createdAt
    }
}

/// 学習時の自己評価。3択でシンプルに。
enum Grade: Int {
    case forgot = 0   // 忘れた
    case vague = 1    // 曖昧
    case good = 2     // 覚えた

    var label: String {
        switch self {
        case .forgot: return "忘れた"
        case .vague: return "曖昧"
        case .good: return "覚えた"
        }
    }
}

extension Card {
    /// 評価を受けて SRS を更新する。SM-2 を 3 段階に簡略化。
    func apply(grade: Grade, now: Date = .now, calendar: Calendar = .current) {
        switch grade {
        case .forgot:
            // 間違えたら最初からやり直し。10分後に再出題。
            reps = 0
            lapses += 1
            intervalDays = 0
            easeFactor = max(1.3, easeFactor - 0.2)
            dueDate = now.addingTimeInterval(10 * 60)
            return

        case .vague:
            // 覚えてはいるが怪しい。間隔は控えめに伸ばす。
            easeFactor = max(1.3, easeFactor - 0.15)

        case .good:
            // しっかり覚えた。
            break
        }

        reps += 1
        switch reps {
        case 1:
            intervalDays = 1
        case 2:
            intervalDays = grade == .vague ? 3 : 4
        default:
            let multiplier = grade == .vague ? max(1.2, easeFactor - 0.3) : easeFactor
            intervalDays = (intervalDays * multiplier).rounded()
        }

        dueDate = calendar.date(byAdding: .day, value: Int(intervalDays), to: now) ?? now
    }

    /// 今このカードは復習対象か。
    func isDue(asOf date: Date = .now) -> Bool {
        dueDate <= date
    }

    /// まだ一度も学習していない新規カードか。
    var isNew: Bool {
        reps == 0 && lapses == 0
    }
}
