import SwiftUI
import SwiftData

struct AddWordView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var hanzi = ""
    @State private var pinyin = ""
    @State private var meaning = ""
    @State private var example = ""
    @State private var exampleMeaning = ""

    @State private var isCompleting = false
    @State private var errorMessage: String?

    private let ai = AIService()

    var body: some View {
        NavigationStack {
            Form {
                Section("漢字") {
                    HStack {
                        TextField("例: 苹果", text: $hanzi)
                            .font(.title3)
                        if !hanzi.isEmpty {
                            Button {
                                Speaker.shared.speak(hanzi)
                            } label: {
                                Image(systemName: "speaker.wave.2.fill")
                            }
                            .buttonStyle(.borderless)
                        }
                    }
                    Button {
                        Task { await complete() }
                    } label: {
                        if isCompleting {
                            HStack { ProgressView(); Text("AIが補完中…") }
                        } else {
                            Label("AIで補完", systemImage: "sparkles")
                        }
                    }
                    .disabled(hanzi.trimmingCharacters(in: .whitespaces).isEmpty || isCompleting)
                }

                Section("内容（AI補完後に編集可）") {
                    LabeledTextField(label: "ピンイン", text: $pinyin)
                    LabeledTextField(label: "意味", text: $meaning)
                    LabeledTextField(label: "例文", text: $example)
                    LabeledTextField(label: "例文の訳", text: $exampleMeaning)
                }

                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("単語を追加")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") { save() }
                        .disabled(hanzi.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func complete() async {
        errorMessage = nil
        isCompleting = true
        defer { isCompleting = false }
        do {
            let result = try await ai.complete(hanzi: hanzi.trimmingCharacters(in: .whitespaces))
            pinyin = result.pinyin
            meaning = result.meaning
            example = result.example
            exampleMeaning = result.exampleMeaning
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func save() {
        let card = Card(
            hanzi: hanzi.trimmingCharacters(in: .whitespaces),
            pinyin: pinyin,
            meaning: meaning,
            example: example,
            exampleMeaning: exampleMeaning
        )
        context.insert(card)
        try? context.save()
        let container = context.container
        Task { await NotificationManager.shared.reschedule(container: container) }
        dismiss()
    }
}

/// ラベル付きの入力欄。
private struct LabeledTextField: View {
    let label: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            TextField(label, text: $text)
        }
    }
}

#Preview {
    AddWordView()
        .modelContainer(for: Card.self, inMemory: true)
}
