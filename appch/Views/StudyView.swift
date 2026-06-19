import SwiftUI
import SwiftData

struct StudyView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    /// 学習対象（開始時点の期限切れカード）。
    let cards: [Card]

    @State private var index = 0
    @State private var revealed = false

    private var current: Card? {
        guard index < cards.count else { return nil }
        return cards[index]
    }

    var body: some View {
        NavigationStack {
            VStack {
                if let card = current {
                    ProgressView(value: Double(index), total: Double(cards.count))
                        .padding(.horizontal)
                    Spacer()
                    cardFace(card)
                    Spacer()
                    controls(card)
                } else {
                    finished
                }
            }
            .padding()
            .screenBackground()
            .navigationTitle("学習")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if let card = current {
                        Button {
                            card.isFavorite.toggle()
                            try? context.save()
                        } label: {
                            Image(systemName: card.isFavorite ? "star.fill" : "star")
                                .foregroundStyle(card.isFavorite ? Color(red: 0.82, green: 0.6, blue: 0.13) : .secondary)
                        }
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("閉じる") { finish() }
                }
            }
        }
    }

    // MARK: - カード表示

    private func cardFace(_ card: Card) -> some View {
        VStack(spacing: 20) {
            Text(card.hanzi)
                .font(.system(size: 64, weight: .bold))

            if revealed {
                VStack(spacing: 12) {
                    PinyinText(pinyin: card.pinyin, font: .title2, weight: .semibold)
                    Text(card.meaning)
                        .font(.title3)
                    Divider().padding(.horizontal, 40)
                    VStack(spacing: 6) {
                        Text(card.example).font(.body)
                        Text(card.exampleMeaning)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
                .transition(.opacity)

                Button {
                    Speaker.shared.speak(card.example.isEmpty ? card.hanzi : card.example)
                } label: {
                    Label("発音を聞く", systemImage: "speaker.wave.2.fill")
                }
                .buttonStyle(.bordered)
            } else {
                Text("タップして答えを見る")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 320)
        .padding()
        .cardBackground(24)
        .contentShape(Rectangle())
        .onTapGesture {
            if !revealed { Speaker.shared.speak(card.hanzi) }
            withAnimation(.easeInOut(duration: 0.2)) {
                revealed = true
            }
        }
    }

    // MARK: - 操作ボタン

    @ViewBuilder
    private func controls(_ card: Card) -> some View {
        if revealed {
            HStack(spacing: 12) {
                gradeButton(.forgot, color: .red, card: card)
                gradeButton(.vague, color: .orange, card: card)
                gradeButton(.good, color: .green, card: card)
            }
        } else {
            Button {
                withAnimation { revealed = true }
                Speaker.shared.speak(card.hanzi)
            } label: {
                Text("答えを見る")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
        }
    }

    private func gradeButton(_ grade: Grade, color: Color, card: Card) -> some View {
        Button {
            submit(grade, on: card)
        } label: {
            Text(grade.label)
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
        }
        .buttonStyle(.borderedProminent)
        .tint(color)
    }

    private var finished: some View {
        VStack(spacing: 16) {
            Text("🎉")
                .font(.system(size: 64))
            Text("今日の復習は完了！")
                .font(.title2.bold())
            Button("ホームに戻る") { finish() }
                .buttonStyle(.borderedProminent)
        }
    }

    // MARK: - ロジック

    private func submit(_ grade: Grade, on card: Card) {
        card.apply(grade: grade)
        try? context.save()
        StudyLog.record(context: context)
        withAnimation {
            revealed = false
            index += 1
        }
    }

    private func finish() {
        // 学習結果に合わせて通知を組み直す。
        let container = context.container
        Task { await NotificationManager.shared.reschedule(container: container) }
        dismiss()
    }
}

#Preview {
    StudyView(cards: [])
        .modelContainer(for: Card.self, inMemory: true)
}
