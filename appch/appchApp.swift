import SwiftUI
import SwiftData

@main
struct appchApp: App {
    /// アプリ全体で共有する SwiftData コンテナ。
    let container: ModelContainer

    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    init() {
        do {
            container = try ModelContainer(for: Card.self, StudyLog.self)
        } catch {
            fatalError("ModelContainer の初期化に失敗: \(error)")
        }
        // 通知デリゲートにコンテナを渡しておく（通知からの回答で SRS を更新するため）。
        NotificationManager.shared.container = container
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .task {
                    // 初回起動時に HSK の初期単語を投入。
                    await SeedLoader.seedIfNeeded(container: container)
                    // 通知権限のリクエスト＆カテゴリ登録。
                    await NotificationManager.shared.requestAuthorizationIfNeeded()
                    NotificationManager.shared.registerCategories()
                    // 期限切れカードに合わせて通知を組み直す。
                    await NotificationManager.shared.reschedule(container: container)
                }
        }
        .modelContainer(container)
    }
}

/// UNUserNotificationCenter のデリゲートを設定するための AppDelegate。
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        UNUserNotificationCenter.current().delegate = NotificationManager.shared
        return true
    }
}
