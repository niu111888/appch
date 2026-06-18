import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Card.dueDate, order: .forward) private var cards: [Card]
    @Query private var logs: [StudyLog]

    @State private var showStudy = false
    @State private var showQuiz = false
    @State private var showAdd = false

    /// 選択中のレッスン（"すべて" or デッキ名）。端末に保存。
    @AppStorage("selectedDeck") private var selectedDeck = Decks.all

    /// 選べるレッスン一覧（先頭に「すべて」）。
    private var availableDecks: [String] {
        Decks.available(from: Set(cards.map(\.deck)))
    }

    /// 選択レッスンに属するカード。
    private var deckCards: [Card] {
        selectedDeck == Decks.all ? cards : cards.filter { $0.deck == selectedDeck }
    }

    /// 今復習すべきカード（選択レッスン内の期限切れ）。
    private var dueCards: [Card] {
        let now = Date.now
        return deckCards.filter { $0.isDue(asOf: now) }
    }

    /// クイズの出題元（期限切れ優先、無ければ選択レッスン全体）。
    private var quizPool: [Card] {
        dueCards.isEmpty ? deckCards : dueCards
    }

    /// 連続学習日数。
    private var streak: Int {
        StudyLog.currentStreak(logs: logs)
    }

    /// ウィジェット用に共有データを更新する。
    private func updateWidget() {
        SharedStore.update(dueCount: dueCards.count, streak: streak, word: dueCards.first ?? cards.first)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    lessonSelector
                    dueCard
                    statsRow
                    wordList
                }
                .padding()
            }
            .navigationTitle("中国語")
            .onAppear { updateWidget() }
            .onChange(of: dueCards.count) { updateWidget() }
            .onChange(of: selectedDeck) { updateWidget() }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if streak > 0 {
                        Label("\(streak)", systemImage: "flame.fill")
                            .font(.subheadline.bold())
                            .foregroundStyle(.orange)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAdd = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showAdd) {
                AddWordView()
            }
            .fullScreenCover(isPresented: $showStudy) {
                StudyView(cards: dueCards)
            }
            .fullScreenCover(isPresented: $showQuiz) {
                QuizView(cards: quizPool)
            }
        }
    }

    // MARK: - レッスン選択

    private var lessonSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(availableDecks, id: \.self) { deck in
                    let selected = deck == selectedDeck
                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) { selectedDeck = deck }
                    } label: {
                        Text(deck)
                            .font(.subheadline.weight(selected ? .bold : .regular))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(
                                Capsule().fill(selected ? Color.accentColor : Color.gray.opacity(0.15))
                            )
                            .foregroundStyle(selected ? .white : .primary)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 2)
        }
    }

    // MARK: - 今日の復習カード（メインの導線）

    private var dueCard: some View {
        VStack(spacing: 16) {
            Text("今日の復習")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("\(dueCards.count)")
                .font(.system(size: 72, weight: .bold, design: .rounded))
                .foregroundStyle(dueCards.isEmpty ? .secondary : .primary)
            Text("枚")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Button {
                showStudy = true
            } label: {
                Text(dueCards.isEmpty ? "今日は完了！🎉" : "学習を始める")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            .disabled(dueCards.isEmpty)

            Button {
                showQuiz = true
            } label: {
                Label("4択クイズ", systemImage: "checklist")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
            }
            .buttonStyle(.bordered)
            .disabled(deckCards.count < 4)
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 24))
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            stat(title: "総単語", value: "\(deckCards.count)")
            stat(title: "新規", value: "\(deckCards.filter { $0.isNew }.count)")
            stat(title: "学習済", value: "\(deckCards.filter { !$0.isNew }.count)")
        }
    }

    private func stat(title: String, value: String) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title3.bold())
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var wordList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("単語一覧")
                .font(.headline)
                .padding(.leading, 4)
            ForEach(deckCards) { card in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(card.hanzi).font(.title3)
                        PinyinText(pinyin: card.pinyin, font: .caption)
                    }
                    Spacer()
                    Text(card.meaning)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Button {
                        Speaker.shared.speak(card.hanzi)
                    } label: {
                        Image(systemName: "speaker.wave.2.fill")
                    }
                    .buttonStyle(.borderless)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12))
            }
        }
    }
}

#Preview {
    HomeView()
        .modelContainer(for: Card.self, inMemory: true)
}
