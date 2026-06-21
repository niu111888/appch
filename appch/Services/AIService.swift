import Foundation

/// AI が補完した単語情報。
struct WordCompletion: Codable {
    var hanzi: String
    var pinyin: String
    var meaning: String
    var example: String
    var exampleMeaning: String
}

enum AIServiceError: LocalizedError {
    case missingAPIKey
    case badResponse(String)
    case decoding

    var errorDescription: String? {
        switch self {
        case .missingAPIKey: return "APIキーが未設定です。設定画面で Claude の APIキーを入力してください。"
        case .badResponse(let msg): return "APIエラー: \(msg)"
        case .decoding: return "AIの応答を解釈できませんでした。"
        }
    }
}

/// Claude API を呼び出して、漢字からピンイン・意味・例文を補完する。
struct AIService {
    /// APIキーは Keychain に保存（秘密情報は UserDefaults に置かない）。
    /// 旧バージョンで UserDefaults に保存していた場合は初回アクセス時に自動移行する。
    private static let apiKeyAccount = "claude.apiKey"
    static var apiKey: String {
        get {
            if let k = Keychain.get(apiKeyAccount), !k.isEmpty { return k }
            // 旧 UserDefaults からの移行
            let legacy = UserDefaults.standard.string(forKey: apiKeyAccount) ?? ""
            if !legacy.isEmpty {
                Keychain.set(legacy, for: apiKeyAccount)
                UserDefaults.standard.removeObject(forKey: apiKeyAccount)
            }
            return legacy
        }
        set {
            Keychain.set(newValue, for: apiKeyAccount)
            UserDefaults.standard.removeObject(forKey: apiKeyAccount)
        }
    }

    /// 補完に使うモデル。安価で速い Haiku を既定にする。
    static let model = "claude-haiku-4-5-20251001"

    func complete(hanzi: String) async throws -> WordCompletion {
        let key = AIService.apiKey
        guard !key.isEmpty else { throw AIServiceError.missingAPIKey }

        let url = URL(string: "https://api.anthropic.com/v1/messages")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(key, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")

        // ツール（構造化出力）を強制して、確実に JSON で受け取る。
        let tool: [String: Any] = [
            "name": "save_word",
            "description": "中国語の単語情報を保存する",
            "input_schema": [
                "type": "object",
                "properties": [
                    "pinyin": ["type": "string", "description": "声調記号つきピンイン。例: píngguǒ"],
                    "meaning": ["type": "string", "description": "簡潔な日本語の意味。例: りんご"],
                    "example": ["type": "string", "description": "その単語を使った自然な中国語の短文"],
                    "exampleMeaning": ["type": "string", "description": "例文の日本語訳"]
                ],
                "required": ["pinyin", "meaning", "example", "exampleMeaning"]
            ]
        ]

        let body: [String: Any] = [
            "model": AIService.model,
            "max_tokens": 512,
            "tools": [tool],
            "tool_choice": ["type": "tool", "name": "save_word"],
            "messages": [
                [
                    "role": "user",
                    "content": "中国語の単語「\(hanzi)」について、ピンイン・日本語の意味・例文・例文の日本語訳を save_word ツールで返してください。"
                ]
            ]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw AIServiceError.badResponse("不明な応答")
        }
        guard http.statusCode == 200 else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw AIServiceError.badResponse("status \(http.statusCode) \(text)")
        }

        // content 配列の中から tool_use ブロックを探す。
        guard
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let content = json["content"] as? [[String: Any]],
            let toolUse = content.first(where: { ($0["type"] as? String) == "tool_use" }),
            let input = toolUse["input"] as? [String: Any]
        else {
            throw AIServiceError.decoding
        }

        return WordCompletion(
            hanzi: hanzi,
            pinyin: input["pinyin"] as? String ?? "",
            meaning: input["meaning"] as? String ?? "",
            example: input["example"] as? String ?? "",
            exampleMeaning: input["exampleMeaning"] as? String ?? ""
        )
    }
}
