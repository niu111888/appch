import SwiftUI

/// 複数のリマインダーをカードで管理する画面（参考: 単語アプリのReminders）。
struct RemindersView: View {
    @Environment(\.modelContext) private var context
    @State private var reminders = ReminderStore.load()
    @State private var editingIndex: Int?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Text("毎日のリマインダーで単語を覚えよう")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)

                ForEach(reminders.indices, id: \.self) { idx in
                    reminderCard(idx)
                }

                Button {
                    reminders.append(Reminder(target: .allDue, mode: .study,
                                              timesPerDay: 3, startHour: 9, endHour: 21, enabled: true))
                    editingIndex = reminders.count - 1
                    persist()
                } label: {
                    Label("リマインダーを追加", systemImage: "plus")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                }
                .buttonStyle(.borderedProminent)
                .padding(.top, 8)
            }
            .padding()
        }
        .screenBackground()
        .navigationTitle("リマインダー")
        .sheet(isPresented: Binding(get: { editingIndex != nil },
                                    set: { if !$0 { editingIndex = nil } })) {
            if let idx = editingIndex, idx < reminders.count {
                ReminderEditView(
                    reminder: $reminders[idx],
                    onChange: persist,
                    onDelete: {
                        reminders.remove(at: idx)
                        editingIndex = nil
                        persist()
                    }
                )
            }
        }
    }

    private func reminderCard(_ idx: Int) -> some View {
        let r = reminders[idx]
        return HStack(spacing: 14) {
            Image(systemName: r.target.systemImage)
                .font(.title3)
                .foregroundStyle(r.enabled ? Color.appAccent : .secondary)
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 3) {
                Text(r.target.title).font(.serif(18))
                Text(subtitle(r))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture { editingIndex = idx }

            Toggle("", isOn: $reminders[idx].enabled)
                .labelsHidden()
                .tint(.appAccent)
                .onChange(of: reminders[idx].enabled) { persist() }
        }
        .padding()
        .cardBackground(18)
    }

    private func subtitle(_ r: Reminder) -> String {
        if r.target == .streak {
            return "1日1回 · \(r.startHour)時ごろ"
        }
        let time = r.timesPerDay <= 1 ? "\(r.startHour)時ごろ" : "\(r.startHour)–\(r.endHour)時"
        return "\(r.timesPerDay)回/日 · \(time) · \(r.mode.title)モード"
    }

    private func persist() {
        ReminderStore.save(reminders)
        let c = context.container
        Task { await NotificationManager.shared.reschedule(container: c) }
    }
}

/// リマインダー1件の編集シート。
struct ReminderEditView: View {
    @Binding var reminder: Reminder
    var onChange: () -> Void
    var onDelete: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("対象") {
                    Picker("対象", selection: $reminder.target) {
                        ForEach(ReminderTarget.allCases, id: \.self) { t in
                            Label(t.title, systemImage: t.systemImage).tag(t)
                        }
                    }
                }

                if reminder.target != .streak {
                    Section("通知の見せ方") {
                        Picker("モード", selection: $reminder.mode) {
                            ForEach(NotifMode.allCases, id: \.self) { m in
                                Text(m.title).tag(m)
                            }
                        }
                        .pickerStyle(.segmented)
                        Text(modeHelp)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                }

                Section("頻度・時間帯") {
                    if reminder.target != .streak {
                        Stepper("1日 \(reminder.timesPerDay) 回", value: $reminder.timesPerDay, in: 1...20)
                    }
                    Stepper("開始 \(reminder.startHour) 時", value: $reminder.startHour, in: 0...23)
                    if reminder.timesPerDay > 1 && reminder.target != .streak {
                        Stepper("終了 \(reminder.endHour) 時", value: $reminder.endHour, in: 1...24)
                    }
                }

                Section {
                    Button("このリマインダーを削除", role: .destructive) {
                        onDelete()
                        dismiss()
                    }
                }
            }
            .navigationTitle(reminder.target.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("完了") { onChange(); dismiss() }
                }
            }
        }
    }

    private var modeHelp: String {
        switch reminder.mode {
        case .study: return "通知に単語・ピンイン・意味・例文を表示します。"
        case .recall: return "答えを隠して「思い出す」練習になります。"
        case .quiz: return "通知のボタンで4択クイズに答えられます。"
        }
    }
}
