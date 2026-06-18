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
                Section("通知") {
                    Toggle("通知をオンにする", isOn: $settings.enabled)
                    Stepper("1日の回数: \(settings.remindersPerDay)回", value: $settings.remindersPerDay, in: 1...20)
                    Stepper("開始: \(settings.startHour)時", value: $settings.startHour, in: 0...23)
                    Stepper("終了: \(settings.endHour)時", value: $settings.endHour, in: 1...24)
                    Text("通知には漢字とピンインだけが出て、意味は隠れています。通知のボタンから「覚えてた / 忘れた」をその場で答えられます。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Section("AI補完（Claude API）") {
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
                    }
                }
            }
            .navigationTitle("設定")
        }
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
