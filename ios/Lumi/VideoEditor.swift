import SwiftUI
import AVKit
import Photos

@MainActor final class VideoModel: ObservableObject {
    @Published var duration: Double = 0
    @Published var start: Double = 0
    @Published var end: Double = 0
    @Published var muted = false
    @Published var busy = false
    @Published var ready = false
    @Published var message: String?
    let url: URL
    let player: AVPlayer
    private var exporter: AVAssetExportSession?
    init(url: URL) { self.url = url; player = AVPlayer(url: url) }
    func load() async {
        do {
            let duration = try await AVURLAsset(url: url).load(.duration).seconds
            guard duration.isFinite, duration > 0 else { throw ImagePipeline.Failure.invalidImage }
            self.duration = duration; end = duration; ready = true
        } catch { message = "영상을 열 수 없습니다. 다른 동영상을 선택해 주세요." }
    }
    func seek() { player.seek(to: CMTime(seconds: start, preferredTimescale: 600)) }
    func export() async {
        guard ready, !busy, end > start else { return }
        busy = true; player.pause()
        let from = start, to = end, silent = muted
        let output = FileManager.default.temporaryDirectory.appendingPathComponent("LUMI-export-\(UUID().uuidString).mp4")
        defer { busy = false; exporter = nil; try? FileManager.default.removeItem(at: output) }
        do {
            let asset = AVURLAsset(url: url), composition = AVMutableComposition()
            let range = CMTimeRange(start: CMTime(seconds: from, preferredTimescale: 600), duration: CMTime(seconds: to - from, preferredTimescale: 600))
            let tracks = try await asset.loadTracks(withMediaType: .video)
            guard let source = tracks.first, let video = composition.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid) else { throw ImagePipeline.Failure.invalidImage }
            try video.insertTimeRange(range, of: source, at: .zero)
            video.preferredTransform = try await source.load(.preferredTransform)
            if !silent, let audioSource = try await asset.loadTracks(withMediaType: .audio).first,
               let audio = composition.addMutableTrack(withMediaType: .audio, preferredTrackID: kCMPersistentTrackID_Invalid) {
                let audioRange = try await audioSource.load(.timeRange)
                let available = CMTimeRangeGetIntersection(range, otherRange: audioRange)
                if available.duration.seconds > 0 {
                    try audio.insertTimeRange(available, of: audioSource, at: CMTimeSubtract(available.start, range.start))
                }
            }
            guard let session = AVAssetExportSession(asset: composition, presetName: AVAssetExportPresetHighestQuality),
                  session.supportedFileTypes.contains(.mp4) else { throw ImagePipeline.Failure.saveFailed }
            session.outputURL = output; session.outputFileType = .mp4; session.shouldOptimizeForNetworkUse = false
            exporter = session
            try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                session.exportAsynchronously {
                    if session.status == .completed { continuation.resume() }
                    else { continuation.resume(throwing: session.error ?? ImagePipeline.Failure.saveFailed) }
                }
            }
            let status = await PHPhotoLibrary.requestAuthorization(for: .addOnly)
            guard status == .authorized || status == .limited else { throw ImagePipeline.Failure.permission }
            try await PHPhotoLibrary.shared().performChanges {
                PHAssetCreationRequest.forAsset().addResource(with: .video, fileURL: output, options: nil)
            }
            message = "동영상을 사진 앱에 저장했습니다."
        } catch { message = error.localizedDescription }
    }
    func cleanup() {
        player.pause(); player.replaceCurrentItem(with: nil)
        exporter?.cancelExport(); try? FileManager.default.removeItem(at: url)
    }
}

@MainActor struct VideoEditor: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model: VideoModel
    init(url: URL) { _model = StateObject(wrappedValue: VideoModel(url: url)) }
    var body: some View {
        ZStack {
            LumiTheme.background.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Button { dismiss() } label: { Image(systemName: "chevron.left") }.buttonStyle(LumiButton()).disabled(model.busy)
                    Spacer(); Text("LUMI / VIDEO").font(.system(size: 14)).tracking(2); Spacer()
                }
                VideoPlayer(player: model.player).clipShape(RoundedRectangle(cornerRadius: 22))
                Text("\(time(model.start)) — \(time(model.end)) · \(String(format: "%.1f", model.end - model.start))초").foregroundColor(LumiTheme.accent)
                Group {
                    Text("시작").font(.caption)
                    Slider(value: Binding(get: { model.start }, set: { model.start = min($0, max(0, model.end - 0.1)) }),
                           in: 0...max(0.1, model.duration), onEditingChanged: { if !$0 { model.seek() } })
                    Text("끝").font(.caption)
                    Slider(value: Binding(get: { model.end }, set: { model.end = min(model.duration, max($0, model.start + 0.1)) }), in: 0...max(0.1, model.duration))
                    Toggle("오디오 제거", isOn: $model.muted)
                }.disabled(!model.ready || model.busy)
                Text("선택한 구간을 고화질 MP4로 저장합니다. 영상 필터·속도·자막은 이 버전에 포함되지 않습니다.")
                    .font(.system(size: 12)).foregroundColor(LumiTheme.muted)
                Button { Task { await model.export() } } label: {
                    HStack { if model.busy { ProgressView() }; Text(model.busy ? "저장 중…" : "영상 저장 ↗") }.frame(maxWidth: .infinity)
                }.buttonStyle(LumiButton(primary: true)).disabled(!model.ready || model.busy)
            }.padding(20).foregroundColor(LumiTheme.ink)
        }.tint(LumiTheme.accent).interactiveDismissDisabled(model.busy)
            .task { await model.load() }
            .onDisappear { model.cleanup() }
            .alert("LUMI", isPresented: Binding(get: { model.message != nil }, set: { if !$0 { model.message = nil } })) {
                Button("확인") { model.message = nil }
            } message: { Text(model.message ?? "") }
    }
    private func time(_ seconds: Double) -> String { String(format: "%02d:%02d", Int(seconds) / 60, Int(seconds) % 60) }
}
