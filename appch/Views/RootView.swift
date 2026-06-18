import SwiftUI

struct RootView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("学習", systemImage: "house.fill") }
            StatsView()
                .tabItem { Label("記録", systemImage: "flame.fill") }
            SettingsView()
                .tabItem { Label("設定", systemImage: "gearshape.fill") }
        }
    }
}

#Preview {
    RootView()
        .modelContainer(for: Card.self, inMemory: true)
}
