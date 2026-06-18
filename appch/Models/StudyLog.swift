import Foundation
import SwiftData

/// 1日ごとの学習回数。ストリーク（連続学習日数）とヒートマップに使う。
@Model
final class StudyLog {
    /// その日の0時（startOfDay）。1日1レコード。
    @Attribute(.unique) var day: Date
    /// その日に回答した枚数。
    var count: Int

    init(day: Date, count: Int = 0) {
        self.day = day
        self.count = count
    }
}

extension StudyLog {
    /// 今日の学習を1回ぶん記録する（学習・クイズ共通で呼ぶ）。
    static func record(context: ModelContext, date: Date = .now, calendar: Calendar = .current) {
        let start = calendar.startOfDay(for: date)
        let descriptor = FetchDescriptor<StudyLog>(predicate: #Predicate { $0.day == start })
        if let existing = try? context.fetch(descriptor).first {
            existing.count += 1
        } else {
            context.insert(StudyLog(day: start, count: 1))
        }
        try? context.save()
    }

    /// 連続学習日数（今日または昨日から遡って途切れるまで）。
    static func currentStreak(logs: [StudyLog], calendar: Calendar = .current, now: Date = .now) -> Int {
        let studiedDays = Set(logs.filter { $0.count > 0 }.map { calendar.startOfDay(for: $0.day) })
        guard !studiedDays.isEmpty else { return 0 }

        let today = calendar.startOfDay(for: now)
        // 今日まだなら昨日から数え始める（今日の分が無くても連続は途切れていない扱い）。
        var cursor = studiedDays.contains(today)
            ? today
            : calendar.date(byAdding: .day, value: -1, to: today)!

        var streak = 0
        while studiedDays.contains(cursor) {
            streak += 1
            cursor = calendar.date(byAdding: .day, value: -1, to: cursor)!
        }
        return streak
    }
}
