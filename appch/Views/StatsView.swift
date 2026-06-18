import SwiftUI
import SwiftData

/// 学習記録タブ。連続学習日数（ストリーク）とカレンダーのヒートマップ。
struct StatsView: View {
    @Query(sort: \StudyLog.day, order: .forward) private var logs: [StudyLog]
    @Query private var cards: [Card]

    private var streak: Int {
        StudyLog.currentStreak(logs: logs)
    }

    private var totalAnswered: Int {
        logs.reduce(0) { $0 + $1.count }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    streakCard
                    HeatmapView(logs: logs)
                    totals
                }
                .padding()
            }
            .navigationTitle("記録")
        }
    }

    private var streakCard: some View {
        VStack(spacing: 8) {
            Text("🔥")
                .font(.system(size: 56))
            Text("\(streak)")
                .font(.system(size: 64, weight: .bold, design: .rounded))
                .contentTransition(.numericText())
            Text("日 連続学習")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text(streak == 0 ? "今日から始めよう！" : "この調子！")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 24))
    }

    private var totals: some View {
        HStack(spacing: 12) {
            totalItem(title: "総回答数", value: "\(totalAnswered)")
            totalItem(title: "学習した日", value: "\(logs.filter { $0.count > 0 }.count)")
            totalItem(title: "総単語", value: "\(cards.count)")
        }
    }

    private func totalItem(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title3.bold())
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

/// GitHub風の学習ヒートマップ。直近12週間を表示。
struct HeatmapView: View {
    let logs: [StudyLog]
    private let weeks = 12
    private let calendar = Calendar.current

    /// 日付(0時) → その日の回答数。
    private var countByDay: [Date: Int] {
        var dict: [Date: Int] = [:]
        for log in logs {
            dict[calendar.startOfDay(for: log.day), default: 0] += log.count
        }
        return dict
    }

    /// 表示するグリッド（列=週、各列7日）。左上が最も古い。
    private var gridColumns: [[Date]] {
        let today = calendar.startOfDay(for: .now)
        // 今週の日曜まで戻る基準を作る。
        let weekday = calendar.component(.weekday, from: today) // 1=日
        guard let endOfThisWeek = calendar.date(byAdding: .day, value: 7 - weekday, to: today) else { return [] }
        guard let start = calendar.date(byAdding: .day, value: -(weeks * 7 - 1), to: calendar.date(byAdding: .day, value: -(7 - weekday), to: today)!) else { return [] }

        var columns: [[Date]] = []
        var cursor = start
        for _ in 0..<weeks {
            var col: [Date] = []
            for _ in 0..<7 {
                col.append(cursor)
                cursor = calendar.date(byAdding: .day, value: 1, to: cursor)!
            }
            columns.append(col)
        }
        _ = endOfThisWeek
        return columns
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("学習ヒートマップ")
                .font(.headline)
            HStack(alignment: .top, spacing: 3) {
                ForEach(Array(gridColumns.enumerated()), id: \.offset) { _, column in
                    VStack(spacing: 3) {
                        ForEach(Array(column.enumerated()), id: \.offset) { _, day in
                            RoundedRectangle(cornerRadius: 3)
                                .fill(color(for: countByDay[day] ?? 0))
                                .frame(width: 16, height: 16)
                                .opacity(day > calendar.startOfDay(for: .now) ? 0 : 1) // 未来は非表示
                        }
                    }
                }
            }
            HStack(spacing: 4) {
                Text("少").font(.caption2).foregroundStyle(.secondary)
                ForEach([0, 2, 4, 6], id: \.self) { c in
                    RoundedRectangle(cornerRadius: 2).fill(color(for: c)).frame(width: 12, height: 12)
                }
                Text("多").font(.caption2).foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20))
    }

    /// 回答数 → 濃さ。
    private func color(for count: Int) -> Color {
        switch count {
        case 0: return Color.gray.opacity(0.15)
        case 1...2: return Color.accentColor.opacity(0.35)
        case 3...5: return Color.accentColor.opacity(0.6)
        default: return Color.accentColor
        }
    }
}

#Preview {
    StatsView()
        .modelContainer(for: [Card.self, StudyLog.self], inMemory: true)
}
