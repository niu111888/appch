import WidgetKit
import SwiftUI

/// アプリと共有する App Group。アプリ側 SharedStore と一致させること。
private let appGroupSuite = "group.com.genrri.appch"

/// ウィジェットに表示する1コマ分のデータ。
struct WordEntry: TimelineEntry {
    let date: Date
    let dueCount: Int
    let streak: Int
    let deck: String
    let hanzi: String
    let pinyin: String
    let meaning: String
    let example: String
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> WordEntry {
        WordEntry(date: .now, dueCount: 5, streak: 3, deck: "HSK1",
                  hanzi: "苹果", pinyin: "píngguǒ", meaning: "りんご", example: "我喜欢吃苹果。")
    }

    func getSnapshot(in context: Context, completion: @escaping (WordEntry) -> Void) {
        completion(load())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WordEntry>) -> Void) {
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
            deck: d?.string(forKey: "deck") ?? "",
            hanzi: d?.string(forKey: "hanzi") ?? "学",
            pinyin: d?.string(forKey: "pinyin") ?? "",
            meaning: d?.string(forKey: "meaning") ?? "タップして学習",
            example: d?.string(forKey: "example") ?? ""
        )
    }
}

/// サイズ（small / medium / large）に応じて表示を切り替える。
struct appchWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    var entry: Provider.Entry

    var body: some View {
        switch family {
        case .systemSmall: smallView
        case .systemLarge: largeView
        default: mediumView
        }
    }

    // 上部の「今日の復習 ◯」＋ストリーク。
    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 0) {
                Text("今日の復習").font(.caption2).foregroundStyle(.secondary)
                HStack(alignment: .firstTextBaseline, spacing: 3) {
                    Text("\(entry.dueCount)").font(.system(size: 30, weight: .bold, design: .rounded))
                    Text("枚").font(.caption2).foregroundStyle(.secondary)
                }
            }
            Spacer()
            if entry.streak > 0 {
                Label("\(entry.streak)", systemImage: "flame.fill")
                    .font(.caption.bold()).foregroundStyle(.orange)
            }
        }
    }

    private var smallView: some View {
        VStack(alignment: .leading, spacing: 6) {
            header
            Divider()
            Text(entry.hanzi).font(.title3.bold())
            Text(entry.pinyin).font(.caption).foregroundStyle(.secondary).lineLimit(1)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var mediumView: some View {
        VStack(alignment: .leading, spacing: 8) {
            header
            Divider()
            HStack(alignment: .center, spacing: 14) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.hanzi).font(.system(size: 30, weight: .bold))
                    Text(entry.pinyin).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                }
                Spacer()
                Text(entry.meaning)
                    .font(.headline)
                    .multilineTextAlignment(.trailing)
                    .lineLimit(2)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .containerBackground(.fill.tertiary, for: .widget)
    }

    private var largeView: some View {
        VStack(alignment: .leading, spacing: 12) {
            header
            Divider()
            VStack(alignment: .leading, spacing: 6) {
                Text("今日の単語").font(.caption2).foregroundStyle(.secondary)
                Text(entry.hanzi).font(.system(size: 44, weight: .bold))
                Text(entry.pinyin).font(.title3).foregroundStyle(.secondary).lineLimit(1)
                Text(entry.meaning).font(.headline)
            }
            if !entry.example.isEmpty {
                Divider()
                VStack(alignment: .leading, spacing: 2) {
                    Text("例文").font(.caption2).foregroundStyle(.secondary)
                    Text(entry.example).font(.subheadline)
                }
            }
            Spacer()
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
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
