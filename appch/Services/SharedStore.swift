import Foundation
import WidgetKit

/// アプリ → ウィジェットへ App Group 経由でデータを渡す。
/// suiteName は appchWidget 側と一致させること。
enum SharedStore {
    static let suiteName = "group.com.genrri.appch"
    private static var defaults: UserDefaults? { UserDefaults(suiteName: suiteName) }

    /// 今日の復習数・連続日数・代表単語を共有領域に書き込み、ウィジェットを更新する。
    static func update(dueCount: Int, streak: Int, word: Card?) {
        guard let d = defaults else { return }
        d.set(dueCount, forKey: "dueCount")
        d.set(streak, forKey: "streak")
        d.set(word?.hanzi ?? "", forKey: "hanzi")
        d.set(word?.pinyin ?? "", forKey: "pinyin")
        d.set(word?.meaning ?? "", forKey: "meaning")
        d.set(word?.example ?? "", forKey: "example")
        d.set(word?.deck ?? "", forKey: "deck")
        WidgetCenter.shared.reloadAllTimelines()
    }
}
