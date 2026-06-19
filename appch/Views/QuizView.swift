import SwiftUI
import SwiftData

/// 4択クイズ。漢字を見て正しい意味を4択から選ぶ。
/// 回答結果は SRS にも反映する（正解=覚えた / 不正解=忘れた）。
struct QuizView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    /// 出題元のカード（期限切れ、無ければ全カード）。
    let cards: [Card]

    @State private var questions: [QuizQuestion] = []
    @State private var index = 0
    @State private var selectedMeaning: String?
    @State private var score = 0

    private var current: QuizQuestion? {
        guard index < questions.count else { return nil }
        return questions[index]
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                if let q = current {
                    ProgressView(value: Double(index), total: Double(questions.count))
                        .padding(.horizontal)

                    Spacer()
                    questionCard(q)
                    Spacer()
                    options(q)
                } else {
                    finished
                }
            }
            .padding()
            .screenBackground()
            .navigationTitle("クイズ")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("閉じる") { dismiss() }
                }
            }
        }
        .onAppear(perform: buildQuestions)
    }

    // MARK: - 出題カード

    private func questionCard(_ q: QuizQuestion) -> some View {
        VStack(spacing: 12) {
            Text(q.card.hanzi)
                .font(.system(size: 60, weight: .bold))
            PinyinText(pinyin: q.card.pinyin, font: .title3, weight: .semibold)
            Button {
                Speaker.shared.speak(q.card.hanzi)
            } label: {
                Image(systemName: "speaker.wave.2.fill")
            }
            .buttonStyle(.bordered)
        }
        .frame(maxWidth: .infinity, minHeight: 200)
        .padding()
        .cardBackground(24)
    }

    // MARK: - 選択肢

    private func options(_ q: QuizQuestion) -> some View {
        VStack(spacing: 12) {
            ForEach(q.options, id: \.self) { option in
                Button {
                    select(option, for: q)
                } label: {
                    Text(option)
                        .font(.headline)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                }
                .buttonStyle(.bordered)
                .tint(tint(for: option, correct: q.card.meaning))
                .disabled(selectedMeaning != nil)
            }
        }
    }

    /// 回答後の色：正解=緑、選んだ誤答=赤、それ以外=既定。
    private func tint(for option: String, correct: String) -> Color {
        guard let selected = selectedMeaning else { return .accentColor }
        if option == correct { return .green }
        if option == selected { return .red }
        return .gray
    }

    private var finished: some View {
        VStack(spacing: 16) {
            Text(score == questions.count ? "🏆" : "🎉")
                .font(.system(size: 64))
            Text("正解 \(score) / \(questions.count)")
                .font(.title.bold())
            Button("ホームに戻る") { dismiss() }
                .buttonStyle(.borderedProminent)
        }
    }

    // MARK: - ロジック

    private func buildQuestions() {
        guard questions.isEmpty else { return }
        let pool = cards.isEmpty ? [] : cards
        let count = min(10, pool.count)
        let chosen = Array(pool.shuffled().prefix(count))
        // 誤答候補は全カードの意味から集める。
        let allMeanings = Array(Set(cards.map(\.meaning)))
        questions = chosen.map { card in
            var distractors = allMeanings.filter { $0 != card.meaning }.shuffled()
            distractors = Array(distractors.prefix(3))
            let options = (distractors + [card.meaning]).shuffled()
            return QuizQuestion(card: card, options: options)
        }
    }

    private func select(_ option: String, for q: QuizQuestion) {
        guard selectedMeaning == nil else { return }
        selectedMeaning = option
        let correct = option == q.card.meaning
        if correct { score += 1 }
        // SRS に反映。
        q.card.apply(grade: correct ? .good : .forgot)
        try? context.save()
        StudyLog.record(context: context)

        // 少し見せてから次へ。
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
            withAnimation {
                selectedMeaning = nil
                index += 1
            }
        }
    }
}

/// 1問分のデータ。
struct QuizQuestion {
    let card: Card
    let options: [String]
}
