import SwiftUI
import SwiftData
import UniformTypeIdentifiers

/// CSV／テキストから単語をまとめてインポートする画面。
struct ImportView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var text = ""
    @State private var deck = Decks.myWords
    @State private var aiComplete = false
    @State private var importing = false
    @State private var progress = ""
    @State private var errorMessage: String?
    @State private var showFileImporter = false

    private let ai = AIService()

    var body: some View {
        NavigationStack {
            Form {
                Section("保存先レッスン") {
                    Picker("レッスン", selection: $deck) {
                        ForEach(Decks.selectableForAdd, id: \.self) { d in Text(d).tag(d) }
                    }
                }

                Section(header: Text("貼り付け / 読み込み")) {
                    TextEditor(text: $text)
                        .frame(minHeight: 160)
                        .font(.body)
                    Text("1行に1単語。カンマ区切りで「漢字,ピンイン,意味,例文,例文訳」も可。漢字だけでもOK（下のAI補完を使うと自動で埋まります）。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    Button {
                        showFileImporter = true
                    } label: {
                        Label("CSV / テキストファイルを読み込む", systemImage: "doc.badge.plus")
                    }
                }

                Section {
                    Toggle("不足はAIで補完（漢字のみでもOK）", isOn: $aiComplete)
                    if aiComplete {
                        Text("ピンインや意味が空欄の語をClaudeで補完します（設定でAPIキーが必要）。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                if importing {
                    Section { HStack { ProgressView(); Text(progress).font(.footnote) } }
                }
                if let errorMessage {
                    Section { Text(errorMessage).font(.footnote).foregroundStyle(.red) }
                }
            }
            .navigationTitle("まとめてインポート")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("キャンセル") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("取り込む") { Task { await runImport() } }
                        .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || importing)
                }
            }
            .fileImporter(isPresented: $showFileImporter,
                          allowedContentTypes: [.commaSeparatedText, .plainText, .text],
                          allowsMultipleSelection: false) { result in
                handleFile(result)
            }
        }
    }

    private func handleFile(_ result: Result<[URL], Error>) {
        guard let url = (try? result.get())?.first else { return }
        let access = url.startAccessingSecurityScopedResource()
        defer { if access { url.stopAccessingSecurityScopedResource() } }
        if let content = try? String(contentsOf: url, encoding: .utf8) {
            text = text.isEmpty ? content : text + "\n" + content
        } else {
            errorMessage = "ファイルを読み込めませんでした。"
        }
    }

    private func runImport() async {
        errorMessage = nil
        if aiComplete && AIService.apiKey.isEmpty {
            errorMessage = "AI補完にはAPIキーが必要です（設定で入力）。"
            return
        }
        importing = true
        defer { importing = false }

        let lines = text
            .split(whereSeparator: { $0 == "\n" || $0 == "\r" })
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }

        var count = 0
        for (i, line) in lines.enumerated() {
            let cols = line.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
            guard let hanzi = cols.first, !hanzi.isEmpty else { continue }
            var pinyin = cols.count > 1 ? cols[1] : ""
            var meaning = cols.count > 2 ? cols[2] : ""
            var example = cols.count > 3 ? cols[3] : ""
            var exampleMeaning = cols.count > 4 ? cols[4] : ""

            if aiComplete && (pinyin.isEmpty || meaning.isEmpty) {
                progress = "AI補完中 \(i + 1)/\(lines.count)…"
                if let r = try? await ai.complete(hanzi: hanzi) {
                    if pinyin.isEmpty { pinyin = r.pinyin }
                    if meaning.isEmpty { meaning = r.meaning }
                    if example.isEmpty { example = r.example }
                    if exampleMeaning.isEmpty { exampleMeaning = r.exampleMeaning }
                }
            }

            context.insert(Card(deck: deck, hanzi: hanzi, pinyin: pinyin,
                                meaning: meaning, example: example, exampleMeaning: exampleMeaning))
            count += 1
        }
        try? context.save()

        let container = context.container
        Task { await NotificationManager.shared.reschedule(container: container) }
        dismiss()
    }
}

#Preview {
    ImportView()
        .modelContainer(for: Card.self, inMemory: true)
}
