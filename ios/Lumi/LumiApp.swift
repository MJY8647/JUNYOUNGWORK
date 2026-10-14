import SwiftUI

@main @MainActor struct LumiApp: App {
    var body: some Scene {
        WindowGroup { LumiView().preferredColorScheme(.dark) }
    }
}

enum LumiTheme {
    static let background = Color(red: 0.063, green: 0.071, blue: 0.067)
    static let panel = Color(red: 0.114, green: 0.129, blue: 0.118)
    static let accent = Color(red: 0.714, green: 0.949, blue: 0.467)
    static let ink = Color(red: 0.953, green: 0.961, blue: 0.937)
    static let muted = Color(red: 0.608, green: 0.643, blue: 0.608)
}

struct LumiButton: ButtonStyle {
    var primary = false
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.system(size: 14, weight: .semibold))
            .foregroundColor(primary ? LumiTheme.background : LumiTheme.ink)
            .padding(.horizontal, 16).frame(minHeight: 46)
            .background(primary ? LumiTheme.accent : LumiTheme.panel)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            .opacity(configuration.isPressed ? 0.7 : 1)
    }
}
