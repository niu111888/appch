import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var context

    @State private var apiKey = AIService.apiKey
    @State private var saved = false
    @AppStorage("themeMode") private var themeMode = "system"

    var body: some View {
        NavigationStack {
            Form {
                Section(header: sectionHeader("テーマ")) {
                    Picker("外観", selection: $themeMode) {
                        Text("システム").tag("system")
                        Text("ライト").tag("light")
                        Text("ダーク").tag("dark")
                    }
                    .pickerStyle(.segmented)
                }

                Section(header: sectionHeader("通知")) {
                    NavigationLink {
                        RemindersView()
                    } label: {
                        Label("リマインダー", systemImage: "bell.badge.fill")
                    }
                    Text("全単語・お気に入り・苦手・ストリークごとにリマインダーを作れます。通知の見せ方は勉強／思い出し／クイズから選べます。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section(header: sectionHeader("AI補完（Claude API）")) {
                    SecureField("sk-ant-...", text: $apiKey)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Text("単語追加・インポート時に、漢字からピンイン・意味・例文を自動生成します。APIキーは端末内にのみ保存されます。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section {
                    Button {
                        AIService.apiKey = apiKey
                        withAnimation { saved = true }
                    } label: {
                        Text(saved ? "保存しました ✓" : "APIキーを保存")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                    }
                    .listRowBackground(Color.appAccent)
                    .foregroundStyle(.white)
                }
            }
            .screenBackground()
            .navigationTitle("設定")
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.serif(15))
            .foregroundStyle(.secondary)
            .textCase(nil)
    }
}

#Preview {
    SettingsView()
        .modelContainer(for: Card.self, inMemory: true)
}
