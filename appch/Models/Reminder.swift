import Foundation

/// リマインダーの対象（どの単語を通知に出すか）。
enum ReminderTarget: String, Codable, CaseIterable {
    case allDue       // 復習予定の単語（全レッスン横断）
    case favorites    // お気に入り
    case weak         // 苦手（間違えた単語）
    case streak       // 継続リマインド（単語なし）

    var title: String {
        switch self {
        case .allDue: return "全単語"
        case .favorites: return "お気に入り"
        case .weak: return "苦手"
        case .streak: return "ストリーク"
        }
    }

    var systemImage: String {
        switch self {
        case .allDue: return "book.fill"
        case .favorites: return "star.fill"
        case .weak: return "exclamationmark.triangle.fill"
        case .streak: return "flame.fill"
        }
    }
}

/// 通知の見せ方。
enum NotifMode: String, Codable, CaseIterable {
    case study   // 意味・例文も表示（見るだけで学べる）
    case recall  // 答えを隠す
    case quiz    // 4択クイズ

    var title: String {
        switch self {
        case .study: return "勉強"
        case .recall: return "思い出し"
        case .quiz: return "クイズ"
        }
    }
}

/// 1つのリマインダー設定。
struct Reminder: Codable, Identifiable, Equatable {
    var id = UUID()
    var target: ReminderTarget
    var mode: NotifMode
    var timesPerDay: Int
    var startHour: Int
    var endHour: Int
    var enabled: Bool

    /// 通知を出す日時を生成する（今日〜daysAhead日先）。
    func fireDates(daysAhead: Int = 2, now: Date = .now, calendar: Calendar = .current) -> [Date] {
        var dates: [Date] = []
        for day in 0..<daysAhead {
            guard let base = calendar.date(byAdding: .day, value: day, to: now) else { continue }
            let dayStart = calendar.startOfDay(for: base)
            if timesPerDay <= 1 {
                if let d = calendar.date(bySettingHour: startHour, minute: 0, second: 0, of: dayStart), d > now {
                    dates.append(d)
                }
            } else {
                let span = max(1, endHour - startHour)
                for i in 0..<timesPerDay {
                    let frac = Double(i) / Double(timesPerDay - 1)
                    let hf = Double(startHour) + frac * Double(span)
                    let h = min(23, Int(hf))
                    let m = Int((hf - Double(h)) * 60)
                    if let d = calendar.date(bySettingHour: h, minute: m, second: 0, of: dayStart), d > now {
                        dates.append(d)
                    }
                }
            }
        }
        return dates
    }
}

/// リマインダー一覧の保存（UserDefaults）。
enum ReminderStore {
    private static let key = "reminders.v1"

    static func load() -> [Reminder] {
        guard
            let data = UserDefaults.standard.data(forKey: key),
            let arr = try? JSONDecoder().decode([Reminder].self, from: data)
        else { return defaults }
        return arr
    }

    static func save(_ reminders: [Reminder]) {
        if let data = try? JSONEncoder().encode(reminders) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    static let defaults: [Reminder] = [
        Reminder(target: .allDue, mode: .study, timesPerDay: 6, startHour: 9, endHour: 21, enabled: true),
        Reminder(target: .favorites, mode: .quiz, timesPerDay: 1, startHour: 18, endHour: 19, enabled: false),
        Reminder(target: .streak, mode: .study, timesPerDay: 1, startHour: 20, endHour: 21, enabled: true),
    ]
}
