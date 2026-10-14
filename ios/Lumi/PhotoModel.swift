import SwiftUI

@MainActor final class PhotoModel: ObservableObject {
    @Published var original: UIImage?
    @Published var preview: UIImage?
    @Published var comparison: UIImage?
    @Published var renderedState = PhotoState()
    @Published var state = PhotoState()
    @Published var history: [PhotoState] = []
    @Published var future: [PhotoState] = []
    @Published var busy = false
    @Published var rendering = false
    @Published var message: String?
    @Published var status = ""
    private var previewInput: UIImage?
    private var generation = 0
    private var token: RenderCancellation?
    private var delayed: DispatchWorkItem?
    private let queue = DispatchQueue(label: "com.junyoung.lumi.photo", qos: .userInitiated)

    func load(_ image: UIImage) {
        token?.cancel(); delayed?.cancel(); generation += 1
        original = image; previewInput = ImagePipeline.scaled(image, maximum: 1100)
        preview = previewInput; comparison = previewInput
        state = PhotoState(); renderedState = state; history = []; future = []; busy = false
        render()
    }
    func remember() {
        history.append(state); if history.count > 30 { history.removeFirst() }; future.removeAll()
    }
    func change(_ update: (inout PhotoState) -> Void) {
        guard !busy else { return }
        remember(); update(&state); render()
    }
    func undo() {
        guard !busy, let previous = history.popLast() else { return }
        future.append(state); state = previous; render()
    }
    func redo() {
        guard !busy, let next = future.popLast() else { return }
        history.append(state); state = next; render()
    }
    func scheduleRender() {
        delayed?.cancel(); token?.cancel()
        let work = DispatchWorkItem { [weak self] in self?.render() }
        delayed = work; DispatchQueue.main.asyncAfter(deadline: .now() + 0.09, execute: work)
    }
    func render() {
        guard let input = previewInput else { return }
        delayed?.cancel(); token?.cancel(); generation += 1
        let id = generation, snapshot = state, next = RenderCancellation()
        token = next; rendering = true; status = "보정 중…"
        queue.async {
            do {
                let output = try ImagePipeline.render(input, state: snapshot, token: next)
                let before = ImagePipeline.geometry(input, snapshot)
                DispatchQueue.main.async { [weak self] in
                    guard let self = self, self.generation == id, !next.isCancelled() else { return }
                    self.preview = output; self.comparison = before; self.renderedState = snapshot
                    self.rendering = false
                    self.status = "완료 · \(Int(self.original?.size.width ?? 0)) × \(Int(self.original?.size.height ?? 0))"
                }
            } catch PixelError.cancelled { } catch {
                DispatchQueue.main.async { [weak self] in
                    guard let self = self, self.generation == id else { return }
                    self.rendering = false; self.status = "보정하지 못했습니다"; self.message = error.localizedDescription
                }
            }
        }
    }
    func collage(_ images: [UIImage], layout: Int) {
        guard images.count >= 2 else { busy = false; message = "콜라주는 2~9장의 사진을 선택해 주세요."; return }
        busy = true
        queue.async {
            let image = ImagePipeline.collage(images, layout: layout)
            DispatchQueue.main.async { [weak self] in self?.load(image) }
        }
    }
    func brush(from: CGPoint, to: CGPoint, reshape: Bool, radius: Float) {
        guard !busy, !rendering, let input = previewInput else { return }
        guard state.edits.count < 100 else { message = "브러시는 사진당 100회까지 지원합니다. 저장한 사진을 다시 열면 계속 편집할 수 있습니다."; return }
        let a = ImagePipeline.originalPoint(from, original: input.size, state: renderedState)
        let b = ImagePipeline.originalPoint(to, original: input.size, state: renderedState)
        change { state in
            state.edits.append(BrushEdit(reshape: reshape, x: Float(a.x), y: Float(a.y), radius: radius,
                dx: max(-0.08, min(0.08, Float(b.x - a.x))), dy: max(-0.08, min(0.08, Float(b.y - a.y)))))
        }
    }
    func save() {
        guard !busy, let original = original else { return }
        let snapshot = state; busy = true
        queue.async {
            do {
                let result = try ImagePipeline.render(original, state: snapshot, token: RenderCancellation())
                ImagePipeline.save(result) { result in
                    DispatchQueue.main.async { [weak self] in
                        self?.busy = false
                        switch result {
                        case .success: self?.message = "사진 앱에 저장했습니다. 워터마크 없이 JPEG 품질 97로 저장했습니다."
                        case .failure(let error): self?.message = error.localizedDescription
                        }
                    }
                }
            } catch { DispatchQueue.main.async { [weak self] in self?.busy = false; self?.message = error.localizedDescription } }
        }
    }
    func close() {
        guard !busy else { return }
        token?.cancel(); delayed?.cancel(); generation += 1
        original = nil; previewInput = nil; preview = nil; comparison = nil
        history = []; future = []; state = PhotoState(); rendering = false
    }
}
