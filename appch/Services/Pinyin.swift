import SwiftUI

/// ピンインの声調（四声）判定と音節分割を担当する。
/// 学習者向けに音節ごとを声調で色分けするために使う。
enum Pinyin {

    // MARK: - 声調の色

    /// 声調番号 → 色。1声=赤 / 2声=緑 / 3声=青 / 4声=紫 / 軽声=グレー。
    static func color(forTone tone: Int) -> Color {
        switch tone {
        case 1: return Color(red: 0.86, green: 0.20, blue: 0.20) // 赤
        case 2: return Color(red: 0.20, green: 0.62, blue: 0.28) // 緑
        case 3: return Color(red: 0.16, green: 0.45, blue: 0.86) // 青
        case 4: return Color(red: 0.55, green: 0.28, blue: 0.78) // 紫
        default: return Color.secondary                          // 軽声
        }
    }

    // MARK: - 声調記号つき母音のテーブル

    /// 声調つき母音 → (基本母音, 声調番号)。
    private static let tonedVowels: [Character: (base: Character, tone: Int)] = [
        "ā": ("a", 1), "á": ("a", 2), "ǎ": ("a", 3), "à": ("a", 4),
        "ē": ("e", 1), "é": ("e", 2), "ě": ("e", 3), "è": ("e", 4),
        "ī": ("i", 1), "í": ("i", 2), "ǐ": ("i", 3), "ì": ("i", 4),
        "ō": ("o", 1), "ó": ("o", 2), "ǒ": ("o", 3), "ò": ("o", 4),
        "ū": ("u", 1), "ú": ("u", 2), "ǔ": ("u", 3), "ù": ("u", 4),
        "ǖ": ("ü", 1), "ǘ": ("ü", 2), "ǚ": ("ü", 3), "ǜ": ("ü", 4),
    ]

    /// 文字列から声調記号を外して基本形にする（音節照合用）。
    private static func toneless(_ s: String) -> String {
        var result = ""
        for ch in s.lowercased() {
            if let mapped = tonedVowels[ch] {
                result.append(mapped.base)
            } else if ch == "v" {
                result.append("ü")
            } else {
                result.append(ch)
            }
        }
        return result
    }

    /// 1音節の声調番号を返す（記号が無ければ 5 = 軽声）。
    private static func tone(of syllable: String) -> Int {
        for ch in syllable {
            if let mapped = tonedVowels[ch] { return mapped.tone }
        }
        return 5
    }

    // MARK: - 有効な音節の集合（最長一致分割に使う）

    private static let initials = ["b","p","m","f","d","t","n","l","g","k","h",
                                   "j","q","x","zh","ch","sh","r","z","c","s",""]
    private static let finals = ["a","o","e","ai","ei","ao","ou","an","en",
                                 "ang","eng","ong","er","i","ia","ie","iao","iu",
                                 "ian","in","iang","ing","iong","u","ua","uo","uai",
                                 "ui","uan","un","uang","ueng","ü","üe","üan","ün"]
    /// 母音始まり（y/w 表記）の独立音節。
    private static let standalone = ["yi","ya","ye","yao","you","yan","yin","yang",
                                     "ying","yong","yu","yue","yuan","yun",
                                     "wu","wa","wo","wai","wei","wan","wen","wang","weng",
                                     "a","o","e","ai","ei","ao","ou","an","en","ang","eng","er","n","ng","m"]

    /// 声母×韻母の組み合わせ＋独立音節を集めた有効音節集合。
    private static let validSyllables: Set<String> = {
        var set = Set<String>()
        for ini in initials {
            for fin in finals {
                set.insert(ini + fin)
            }
        }
        for s in standalone { set.insert(s) }
        return set
    }()

    // MARK: - 音節分割

    /// ピンイン文字列を音節ごとに分け、各音節の (表示文字列, 声調) を返す。
    static func syllables(_ pinyin: String) -> [(text: String, tone: Int)] {
        var result: [(String, Int)] = []
        // まずスペースとアポストロフィで大きく分ける。
        let chunks = pinyin.split(whereSeparator: { $0 == " " || $0 == "'" || $0 == "’" })
        for chunk in chunks {
            result.append(contentsOf: splitChunk(String(chunk)))
        }
        return result
    }

    /// スペースを含まない塊を、有効音節の最長一致で分割する。
    private static func splitChunk(_ chunk: String) -> [(String, Int)] {
        let chars = Array(chunk)
        var result: [(String, Int)] = []
        var i = 0
        let maxLen = 6 // 最長の音節（zhuang 等）は6文字
        while i < chars.count {
            var matched = false
            let upper = min(maxLen, chars.count - i)
            // 長い方から試して、最初に見つかった有効音節を採用。
            for len in stride(from: upper, through: 1, by: -1) {
                let piece = String(chars[i..<(i + len)])
                if validSyllables.contains(toneless(piece)) {
                    result.append((piece, tone(of: piece)))
                    i += len
                    matched = true
                    break
                }
            }
            if !matched {
                // どの音節にも当てはまらなければ1文字だけ進める（安全弁）。
                let piece = String(chars[i])
                result.append((piece, tone(of: piece)))
                i += 1
            }
        }
        return result
    }
}

/// ピンインを声調で色分けして表示するビュー。
struct PinyinText: View {
    let pinyin: String
    var font: Font = .body
    var weight: Font.Weight = .regular

    var body: some View {
        // 音節ごとに色を変えた Text を連結する。
        Pinyin.syllables(pinyin).enumerated().reduce(Text("")) { partial, item in
            let (index, syllable) = item
            // 音節間にスペースを入れて読みやすく。
            let prefix = index == 0 ? "" : " "
            return partial + Text(prefix + syllable.text)
                .foregroundColor(Pinyin.color(forTone: syllable.tone))
        }
        .font(font)
        .fontWeight(weight)
    }
}

#Preview {
    VStack(alignment: .leading, spacing: 12) {
        PinyinText(pinyin: "nǐ hǎo", font: .title)
        PinyinText(pinyin: "píngguǒ", font: .title)
        PinyinText(pinyin: "Zhōngguó", font: .title)
        PinyinText(pinyin: "xièxie", font: .title)
        PinyinText(pinyin: "nǚ'ér", font: .title)
    }
    .padding()
}
