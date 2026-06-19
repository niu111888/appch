import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var context

    @State private var apiKey = AIService.apiKey
    @State private var settings = NotificationSettings.load()
    @State private var saved = false

    var body: some View {
        NavigationStack {
            Form {
                Section(header: sectionHeader("リマインダー")) {
                    Toggle("通知をオンにする", isOn: $settings.enabled)
                    Toggle("通知に意味・例文も表示（勉強モード）", isOn: $settings.showAnswer)
                    Stepper("1日の回数: \(settings.remindersPerDay)回", value: $settings.remindersPerDay, in: 1...20)
                    Stepper("開始: \(settings.startHour)時", value: $settings.startHour, in: 0...23)
                    Stepper("終了: \(settings.endHour)時", value: $settings.endHour, in: 1...24)
                    Text(settings.showAnswer
                         ? "通知に単語・ピンイン・意味・例文を表示します。見るだけで学べる勉強モードです。"
                         : "通知には単語とピンインだけ。意味は隠して「思い出す」練習になります。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section(header: sectionHeader("AI補完（Claude API）")) {
                    SecureField("sk-ant-...", text: $apiKey)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    Text("単語追加時に、漢字からピンイン・意味・例文を自動生成します。APIキーは端末内にのみ保存されます。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section {
                    Button {
                        apply()
                    } label: {
                        Text(saved ? "保存しました ✓" : "保存")
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

    private func apply() {
        AIService.apiKey = apiKey
        settings.save()
        let container = context.container
        Task { await NotificationManager.shared.reschedule(container: container) }
        withAnimation { saved = true }
    }
}

#Preview {
    SettingsView()
        .modelContainer(for: Card.self, inMemory: true)
}
