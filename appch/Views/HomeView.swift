import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var context
    @Query(sort: \Card.dueDate, order: .forward) private var cards: [Card]

    @State private var showStudy = false
    @State private var showAdd = false

    /// 今復習すべきカード（期限切れ）。
    private var dueCards: [Card] {
        let now = Date.now
        return cards.filter { $0.isDue(asOf: now) }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    dueCard
                    statsRow
                    wordList
                }
                .padding()
            }
            .navigationTitle("中国語")
            .toolbar {
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
        }
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 24))
    }

    private var statsRow: some View {
        HStack(spacing: 12) {
            stat(title: "総単語", value: "\(cards.count)")
            stat(title: "新規", value: "\(cards.filter { $0.isNew }.count)")
            stat(title: "学習済", value: "\(cards.filter { !$0.isNew }.count)")
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
            ForEach(cards) { card in
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(card.hanzi).font(.title3)
                        Text(card.pinyin).font(.caption).foregroundStyle(.secondary)
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
