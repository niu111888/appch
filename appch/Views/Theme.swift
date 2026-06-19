import SwiftUI
import UIKit

/// ライト/ダークで切り替わる動的カラーを作る。
private func dynamicColor(light: (CGFloat, CGFloat, CGFloat), dark: (CGFloat, CGFloat, CGFloat)) -> Color {
    Color(uiColor: UIColor { trait in
        let c = trait.userInterfaceStyle == .dark ? dark : light
        return UIColor(red: c.0, green: c.1, blue: c.2, alpha: 1)
    })
}

/// アプリ全体の配色（ミント＆クリーム / ダーク対応）。
extension Color {
    /// 背景：クリーム（ライト）／チャコール（ダーク）。
    static let appBackground = dynamicColor(light: (0.957, 0.941, 0.902), dark: (0.10, 0.11, 0.105))
    /// カードの面：オフホワイト（ライト）／ダークグレー（ダーク）。
    static let appCard = dynamicColor(light: (1.0, 0.996, 0.988), dark: (0.16, 0.17, 0.165))
    /// ミントのアクセント（両モード共通・AccentColor と合わせる）。
    static let appAccent = Color(red: 0.18, green: 0.66, blue: 0.56)
    /// アクセントの淡い面。
    static let appAccentSoft = Color(red: 0.18, green: 0.66, blue: 0.56).opacity(0.16)
    /// 主要テキスト：墨（ライト）／オフホワイト（ダーク）。
    static let appInk = dynamicColor(light: (0.13, 0.14, 0.13), dark: (0.93, 0.93, 0.92))
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
