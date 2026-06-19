import Foundation
import UserNotifications
import SwiftData

/// ローカル通知のスケジューリングと、通知からの回答処理をまとめて担当する。
final class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationManager()

    /// 通知からの回答で SRS を更新するために App から渡される。
    var container: ModelContainer?

    private let center = UNUserNotificationCenter.current()

    // カテゴリ／アクションの識別子。
    private let categoryID = "WORD_REVIEW"
    private let actionGood = "ANSWER_GOOD"
    private let actionForgot = "ANSWER_FORGOT"
    private let cardIDKey = "cardID"

    // MARK: - 権限とカテゴリ

    func requestAuthorizationIfNeeded() async {
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .notDetermined else { return }
        _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    /// 通知に「覚えてた／忘れた」のボタンを付けるためのカテゴリ登録。
    func registerCategories() {
        let good = UNNotificationAction(identifier: actionGood, title: "覚えてた 👍", options: [])
        let forgot = UNNotificationAction(identifier: actionForgot, title: "忘れた 🤔", options: [])
        let category = UNNotificationCategory(
            identifier: categoryID,
            actions: [good, forgot],
            intentIdentifiers: [],
            options: []
        )
        center.setNotificationCategories([category])
    }

    // MARK: - スケジューリング

    /// 期限が近い／新規のカードを使って、設定された時刻に通知を組み直す。
    func reschedule(container: ModelContainer) async {
        let settings = NotificationSettings.load()
        center.removeAllPendingNotificationRequests()
        guard settings.enabled else { return }

        let granted = await center.notificationSettings().authorizationStatus
        guard granted == .authorized || granted == .provisional else { return }

        let cards = upcomingCards(container: container, limit: settings.remindersPerDay * 3)
        guard !cards.isEmpty else { return }

        let fireDates = settings.upcomingFireDates(count: settings.remindersPerDay * 3)

        for (index, date) in fireDates.enumerated() {
            let card = cards[index % cards.count]
            let content = UNMutableNotificationContent()
            if settings.showAnswer {
                // 勉強モード: 単語・ピンイン・意味・例文を通知に全部のせる（見るだけで学べる）。
                content.title = card.pinyin.isEmpty ? card.hanzi : "\(card.hanzi)　\(card.pinyin)"
                content.subtitle = card.meaning
                if !card.example.isEmpty {
                    content.body = card.exampleMeaning.isEmpty
                        ? card.example
                        : "\(card.example)\n\(card.exampleMeaning)"
                }
            } else {
                // 思い出しモード: 答えは隠して「思い出す」きっかけにする。
                content.title = "\(card.hanzi)　って何だっけ？"
                content.body = "ピンイン: \(card.pinyin)　▶︎ タップで答え"
            }
            content.sound = .default
            content.categoryIdentifier = categoryID
            content.userInfo = [cardIDKey: card.id.uuidString]

            let comps = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: date)
            let trigger = UNCalendarNotificationTrigger(dateMatching: comps, repeats: false)
            let request = UNNotificationRequest(identifier: "review-\(index)", content: content, trigger: trigger)
            try? await center.add(request)
        }
    }

    /// 復習期限が近い順にカードを取得（なければ新規カード）。
    private func upcomingCards(container: ModelContainer, limit: Int) -> [Card] {
        let context = ModelContext(container)
        var descriptor = FetchDescriptor<Card>(sortBy: [SortDescriptor(\.dueDate, order: .forward)])
        descriptor.fetchLimit = max(limit, 1)
        return (try? context.fetch(descriptor)) ?? []
    }

    // MARK: - UNUserNotificationCenterDelegate

    /// フォアグラウンドでも通知を表示する。
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .list]
    }

    /// 通知のボタン（覚えてた／忘れた）やタップを処理する。
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        defer { /* 何もしない */ }
        guard let container else { return }
        let info = response.notification.request.content.userInfo
        guard let idString = info[cardIDKey] as? String, !idString.isEmpty else { return }

        let grade: Grade?
        switch response.actionIdentifier {
        case actionGood: grade = .good
        case actionForgot: grade = .forgot
        default: grade = nil // 本体タップ：アプリを開くだけ
        }

        if let grade, let uuid = UUID(uuidString: idString) {
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

/// 通知の設定。UserDefaults に保存する軽量な構造体。
struct NotificationSettings {
    var enabled: Bool
    var remindersPerDay: Int
    var startHour: Int
    var endHour: Int
    /// 通知に意味・例文も載せる（勉強モード）。false なら答えを隠す思い出しモード。
    var showAnswer: Bool

    static let defaults = NotificationSettings(enabled: true, remindersPerDay: 6, startHour: 9, endHour: 21, showAnswer: true)

    private enum Keys {
        static let enabled = "notif.enabled"
        static let count = "notif.count"
        static let start = "notif.start"
        static let end = "notif.end"
        static let showAnswer = "notif.showAnswer"
        static let initialized = "notif.initialized"
    }

    static func load() -> NotificationSettings {
        let d = UserDefaults.standard
        guard d.bool(forKey: Keys.initialized) else { return defaults }
        return NotificationSettings(
            enabled: d.bool(forKey: Keys.enabled),
            remindersPerDay: max(1, d.integer(forKey: Keys.count)),
            startHour: d.integer(forKey: Keys.start),
            endHour: d.integer(forKey: Keys.end),
            showAnswer: d.object(forKey: Keys.showAnswer) as? Bool ?? true
        )
    }

    func save() {
        let d = UserDefaults.standard
        d.set(enabled, forKey: Keys.enabled)
        d.set(remindersPerDay, forKey: Keys.count)
        d.set(startHour, forKey: Keys.start)
        d.set(endHour, forKey: Keys.end)
        d.set(showAnswer, forKey: Keys.showAnswer)
        d.set(true, forKey: Keys.initialized)
    }

    /// 開始〜終了時刻のあいだに、今日以降の通知時刻を等間隔で生成する。
    func upcomingFireDates(count: Int, now: Date = .now, calendar: Calendar = .current) -> [Date] {
        guard count > 0, endHour > startHour else { return [] }
        let span = endHour - startHour
        var dates: [Date] = []
        var dayOffset = 0
        while dates.count < count {
            for i in 0..<remindersPerDay {
                // その日の通知時刻を等間隔に配置。
                let fraction = remindersPerDay == 1 ? 0.5 : Double(i) / Double(remindersPerDay - 1)
                let hourFloat = Double(startHour) + fraction * Double(span)
                let hour = Int(hourFloat)
                let minute = Int((hourFloat - Double(hour)) * 60)
                var comps = calendar.dateComponents([.year, .month, .day], from: calendar.date(byAdding: .day, value: dayOffset, to: now) ?? now)
                comps.hour = hour
                comps.minute = minute
                if let date = calendar.date(from: comps), date > now {
                    dates.append(date)
                    if dates.count >= count { break }
                }
            }
            dayOffset += 1
            if dayOffset > 14 { break } // 安全弁
        }
        return dates
    }
}
