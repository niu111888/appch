import WidgetKit
import SwiftUI

/// アプリと共有する App Group。アプリ側 SharedStore と一致させること。
private let appGroupSuite = "group.com.genrri.appch"

/// ウィジェットに表示する1コマ分のデータ。
struct WordEntry: TimelineEntry {
    let date: Date
    let dueCount: Int
    let streak: Int
    let hanzi: String
    let pinyin: String
    let meaning: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WordEntry {
        WordEntry(date: .now, dueCount: 5, streak: 3, hanzi: "苹果", pinyin: "píngguǒ", meaning: "りんご")
    }

    func getSnapshot(in context: Context, completion: @escaping (WordEntry) -> Void) {
        completion(load())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WordEntry>) -> Void) {
        // 1時間ごとに読み直す（アプリ側が更新したら即時 reload も走る）。
        let next = Calendar.current.date(byAdding: .hour, value: 1, to: .now) ?? .now
        completion(Timeline(entries: [load()], policy: .after(next)))
    }

    /// App Group の共有領域から最新の値を読む。
    private func load() -> WordEntry {
        let d = UserDefaults(suiteName: appGroupSuite)
        return WordEntry(
            date: .now,
            dueCount: d?.integer(forKey: "dueCount") ?? 0,
            streak: d?.integer(forKey: "streak") ?? 0,
            hanzi: d?.string(forKey: "hanzi") ?? "学",
            pinyin: d?.string(forKey: "pinyin") ?? "",
            meaning: d?.string(forKey: "meaning") ?? "タップして学習"
        )
    }
}

struct appchWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("今日の復習")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Spacer()
                if entry.streak > 0 {
                    Label("\(entry.streak)", systemImage: "flame.fill")
                        .font(.caption2.bold())
                        .foregroundStyle(.orange)
                }
            }
            Text("\(entry.dueCount)")
                .font(.system(size: 36, weight: .bold, design: .rounded))
            Divider()
            Text(entry.hanzi)
                .font(.title3.bold())
            Text(entry.pinyin)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

@main
struct appchWidget: Widget {
    let kind = "appchWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            appchWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("今日の復習")
        .description("復習する単語数と今日の単語を表示します。")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
