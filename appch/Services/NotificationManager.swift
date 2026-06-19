import Foundation
import UserNotifications
import SwiftData

/// ローカル通知のスケジューリングと、通知からの回答処理をまとめて担当する。
/// 複数リマインダー（全単語/お気に入り/苦手/ストリーク）と、勉強/思い出し/4択クイズの
/// 3モードに対応する。
final class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationManager()

    /// 通知からの回答で SRS を更新するために App から渡される。
    var container: ModelContainer?

    private let center = UNUserNotificationCenter.current()

    // 識別子。
    private let reviewCategoryID = "WORD_REVIEW"
    private let actionGood = "ANSWER_GOOD"
    private let actionForgot = "ANSWER_FORGOT"
    private let cardIDKey = "cardID"
    private let quizCorrectKey = "quizCorrect"

    // MARK: - 権限とカテゴリ

    func requestAuthorizationIfNeeded() async {
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .notDetermined else { return }
        _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    /// 基本の「覚えてた／忘れた」カテゴリを登録（起動時）。
    func registerCategories() {
        center.setNotificationCategories([reviewCategory()])
    }

    private func reviewCategory() -> UNNotificationCategory {
        let good = UNNotificationAction(identifier: actionGood, title: "覚えてた 👍", options: [])
        let forgot = UNNotificationAction(identifier: actionForgot, title: "忘れた 🤔", options: [])
        return UNNotificationCategory(identifier: reviewCategoryID, actions: [good, forgot],
                                      intentIdentifiers: [], options: [])
    }

    // MARK: - スケジューリング

    /// 有効なリマインダーすべてに合わせて通知を組み直す。
    func reschedule(container: ModelContainer) async {
        center.removeAllPendingNotificationRequests()
        let reminders = ReminderStore.load().filter { $0.enabled }

        let status = await center.notificationSettings().authorizationStatus
        guard status == .authorized || status == .provisional else { return }
        guard !reminders.isEmpty else {
            center.setNotificationCategories([reviewCategory()])
            return
        }

        let context = ModelContext(container)
        let allCards = (try? context.fetch(FetchDescriptor<Card>())) ?? []

        var categories: Set<UNNotificationCategory> = [reviewCategory()]
        var requests: [UNNotificationRequest] = []

        for (ri, reminder) in reminders.enumerated() {
            let words = wordSet(for: reminder.target, from: allCards)
            let dates = reminder.fireDates()
            for (i, date) in dates.enumerated() {
                let id = "r\(ri)-\(i)"
                let content = UNMutableNotificationContent()
                content.sound = .default

                if reminder.target == .streak {
                    content.title = "🔥 学習を忘れずに"
                    content.body = "今日の単語を復習して連続記録を伸ばそう"
                } else {
                    guard !words.isEmpty else { continue }
                    let card = words[i % words.count]
                    var info: [String: Any] = [cardIDKey: card.id.uuidString]

                    switch reminder.mode {
                    case .study:
                        content.title = card.pinyin.isEmpty ? card.hanzi : "\(card.hanzi)　\(card.pinyin)"
                        content.subtitle = card.meaning
                        if !card.example.isEmpty {
                            content.body = card.exampleMeaning.isEmpty
                                ? card.example : "\(card.example)\n\(card.exampleMeaning)"
                        }
                        content.categoryIdentifier = reviewCategoryID
                    case .recall:
                        content.title = "\(card.hanzi)　って何だっけ？"
                        content.body = "ピンイン: \(card.pinyin)　▶︎ タップで答え"
                        content.categoryIdentifier = reviewCategoryID
                    case .quiz:
                        let quiz = buildQuiz(card: card, allCards: allCards, salt: id)
                        categories.insert(quiz.category)
                        content.title = card.pinyin.isEmpty ? card.hanzi : "\(card.hanzi)　\(card.pinyin)"
                        content.body = "意味はどれ？"
                        content.categoryIdentifier = quiz.categoryID
                        info[quizCorrectKey] = quiz.correctIndex
                    }
                    content.userInfo = info
                }

                let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
                let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
                requests.append(UNNotificationRequest(identifier: id, content: content, trigger: trigger))
            }
        }

        center.setNotificationCategories(categories)
        for req in requests { try? await center.add(req) }
    }

    /// 対象に応じた単語の集合。
    private func wordSet(for target: ReminderTarget, from cards: [Card]) -> [Card] {
        switch target {
        case .allDue:
            let now = Date.now
            let due = cards.filter { $0.isDue(asOf: now) }
            return due.isEmpty ? cards : due
        case .favorites:
            return cards.filter { $0.isFavorite }
        case .weak:
            return cards.filter { $0.lapses >= 1 }.sorted { $0.lapses > $1.lapses }
        case .streak:
            return []
        }
    }

    /// 1問分のクイズ用カテゴリを作る（4択の選択肢をアクションにする）。
    private func buildQuiz(card: Card, allCards: [Card], salt: String)
        -> (categoryID: String, category: UNNotificationCategory, correctIndex: Int) {
        var distractors = Array(Set(allCards.map(\.meaning))).filter { $0 != card.meaning }.shuffled()
        distractors = Array(distractors.prefix(3))
        var options = distractors + [card.meaning]
        options.shuffle()
        let correctIndex = options.firstIndex(of: card.meaning) ?? 0
        let actions = options.enumerated().map { idx, text in
            UNNotificationAction(identifier: "OPT\(idx)", title: text, options: [])
        }
        let categoryID = "QUIZ-\(salt)"
        let category = UNNotificationCategory(identifier: categoryID, actions: actions,
                                              intentIdentifiers: [], options: [])
        return (categoryID, category, correctIndex)
    }

    // MARK: - UNUserNotificationCenterDelegate

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        guard let container else { return }
        let info = response.notification.request.content.userInfo
        guard let idString = info[cardIDKey] as? String, let uuid = UUID(uuidString: idString) else {
            return
        }

        let action = response.actionIdentifier
        var grade: Grade?
        if action == actionGood {
            grade = .good
        } else if action == actionForgot {
            grade = .forgot
        } else if action.hasPrefix("OPT") {
            // クイズの回答：選んだ選択肢が正解かどうか。
            let chosen = Int(action.dropFirst(3)) ?? -1
            let correct = info[quizCorrectKey] as? Int ?? -2
            grade = (chosen == correct) ? .good : .forgot
        }

        if let grade {
            let context = ModelContext(container)
            var descriptor = FetchDescriptor<Card>(predicate: #Predicate { $0.id == uuid })
            descriptor.fetchLimit = 1
            if let card = try? context.fetch(descriptor).first {
                card.apply(grade: grade)
                try? context.save()
            }
        }

        await reschedule(container: container)
    }
}
