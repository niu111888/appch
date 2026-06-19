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

    /// 間違えたことのある単語（苦手）。
    private var weakCards: [Card] {
        cards.filter { $0.lapses >= 1 }
    }

    /// 苦手レッスンを選んでいるか。
    private var isWeakSelected: Bool { selectedDeck == Decks.weak }

    /// 選べるレッスン一覧（先頭に「すべて」、苦手があれば2番目に「苦手」）。
    private var availableDecks: [String] {
        var list = Decks.available(from: Set(cards.map(\.deck)))
        if !weakCards.isEmpty {
            list.insert(Decks.weak, at: 1)
        }
        return list
    }

    /// 選択レッスンに属するカード。
    private var deckCards: [Card] {
        switch selectedDeck {
        case Decks.all: return cards
        case Decks.weak: return weakCards.sorted { $0.lapses > $1.lapses }
        default: return cards.filter { $0.deck == selectedDeck }
        }
    }

    /// 復習対象。通常は期限切れ、苦手レッスンでは期限に関係なく全部。
    private var dueCards: [Card] {
        if isWeakSelected { return deckCards }
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
            .screenBackground()
            .navigationTitle("中国語")
            .onAppear {
                // 選択レッスンが消えていたら「すべて」に戻す。
                if !availableDecks.contains(selectedDeck) { selectedDeck = Decks.all }
                updateWidget()
            }
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
                    let isWeak = deck == Decks.weak
                    Button {
                        withAnimation(.easeInOut(duration: 0.15)) { selectedDeck = deck }
                    } label: {
                        HStack(spacing: 4) {
                            if isWeak { Image(systemName: "exclamationmark.triangle.fill").font(.caption2) }
                            Text(deck)
                        }
                        .font(.subheadline.weight(selected ? .bold : .regular))
                        .padding(.horizontal, 14)
                        .padding(.vertical, 8)
                        .background(
                            Capsule().fill(
                                selected
                                    ? (isWeak ? Color.orange : Color.accentColor)
                                    : (isWeak ? Color.orange.opacity(0.18) : Color.gray.opacity(0.15))
                            )
                        )
                        .foregroundStyle(selected ? .white : (isWeak ? Color.orange : Color.primary))
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
            Text(isWeakSelected ? "苦手を集中復習" : "今日の復習")
                .font(.serif(18))
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
                Text(dueCards.isEmpty
                     ? (isWeakSelected ? "苦手はありません！🎉" : "今日は完了！🎉")
                     : (isWeakSelected ? "苦手を復習" : "学習を始める"))
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
            .tint(isWeakSelected ? .orange : .accentColor)
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
        .cardBackground(24)
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
        .cardBackground(16)
    }

    private var wordList: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("単語一覧")
                .font(.serif(20))
                .padding(.leading, 4)
            ForEach(deckCards) { card in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(card.hanzi).font(.title3)
                        PinyinText(pinyin: card.pinyin, font: .caption)
                    }
                    if card.lapses >= 1 {
                        Text("✕\(card.lapses)")
                            .font(.caption2.bold())
                            .foregroundStyle(.orange)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Color.orange.opacity(0.15), in: Capsule())
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
                .cardBackground(12)
            }
        }
    }
}

#Preview {
    HomeView()
        .modelContainer(for: [Card.self, StudyLog.self], inMemory: true)
}
