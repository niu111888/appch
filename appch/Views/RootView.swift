import SwiftUI
import UIKit

struct RootView: View {
    /// テーマ設定（"system" / "light" / "dark"）。
    @AppStorage("themeMode") private var themeMode = "system"

    init() {
        configureAppearance()
    }

    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("学習", systemImage: "house.fill") }
            StatsView()
                .tabItem { Label("記録", systemImage: "flame.fill") }
            SettingsView()
                .tabItem { Label("設定", systemImage: "gearshape.fill") }
        }
        .tint(.appAccent)
        .preferredColorScheme(colorScheme)
    }

    private var colorScheme: ColorScheme? {
        switch themeMode {
        case "light": return .light
        case "dark": return .dark
        default: return nil // システムに従う
        }
    }

    /// ナビゲーション/タブバーをクリーム背景＋セリフ見出しに整える。
    private func configureAppearance() {
        let bg = UIColor(Color.appBackground)
        let ink = UIColor(Color.appInk)

        let nav = UINavigationBarAppearance()
        nav.configureWithOpaqueBackground()
        nav.backgroundColor = bg
        nav.shadowColor = .clear
        if let large = UIFont.preferredFont(forTextStyle: .largeTitle).fontDescriptor.withDesign(.serif) {
            nav.largeTitleTextAttributes = [.font: UIFont(descriptor: large, size: 32), .foregroundColor: ink]
        }
        if let inline = UIFont.preferredFont(forTextStyle: .headline).fontDescriptor.withDesign(.serif) {
            nav.titleTextAttributes = [.font: UIFont(descriptor: inline, size: 17), .foregroundColor: ink]
        }
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav

        let tab = UITabBarAppearance()
        tab.configureWithOpaqueBackground()
        tab.backgroundColor = bg
        tab.shadowColor = .clear
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab
    }
}

#Preview {
    RootView()
        .modelContainer(for: [Card.self, StudyLog.self], inMemory: true)
}
