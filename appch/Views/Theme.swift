import SwiftUI

/// アプリ全体の配色（ミント＆クリーム）。
extension Color {
    /// 温かいクリームの背景。
    static let appBackground = Color(red: 0.957, green: 0.941, blue: 0.902)
    /// カードの面（オフホワイト）。
    static let appCard = Color(red: 1.0, green: 0.996, blue: 0.988)
    /// ミントのアクセント（AccentColor と合わせる）。
    static let appAccent = Color(red: 0.18, green: 0.66, blue: 0.56)
    /// アクセントの淡い面。
    static let appAccentSoft = Color(red: 0.18, green: 0.66, blue: 0.56).opacity(0.16)
    /// 墨色のテキスト。
    static let appInk = Color(red: 0.13, green: 0.14, blue: 0.13)
    /// やわらかいコーラル（差し色）。
    static let appCoral = Color(red: 0.95, green: 0.58, blue: 0.50)
}

extension Font {
    /// 見出し用のセリフ体（少しオシャレに）。
    static func serif(_ size: CGFloat, _ weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }
}

extension View {
    /// 白い丸カード（やわらかい影つき）。
    func cardBackground(_ radius: CGFloat = 22) -> some View {
        self
            .background(Color.appCard, in: RoundedRectangle(cornerRadius: radius, style: .continuous))
            .shadow(color: .black.opacity(0.06), radius: 10, x: 0, y: 4)
    }

    /// クリーム背景を敷く（スクロール/フォームの既定背景は隠す）。
    func screenBackground() -> some View {
        self
            .scrollContentBackground(.hidden)
            .background(Color.appBackground.ignoresSafeArea())
    }
}
