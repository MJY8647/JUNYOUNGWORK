import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct PhotoPicker: UIViewControllerRepresentable {
    @Binding var presented: Bool
    var video = false
    var multiple = false
    var onBegin: () -> Void
    var onImages: ([UIImage]) -> Void
    var onVideo: (URL) -> Void
    var onError: (Error) -> Void

    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = video ? .videos : .images
        config.selectionLimit = multiple ? 9 : 1
        config.preferredAssetRepresentationMode = .current
        let controller = PHPickerViewController(configuration: config)
        controller.delegate = context.coordinator
        return controller
    }
    func updateUIViewController(_ controller: PHPickerViewController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(self) }

    final class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let owner: PhotoPicker
        init(_ owner: PhotoPicker) { self.owner = owner }
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            owner.presented = false
            guard !results.isEmpty else { return }
            owner.onBegin()
            if owner.video {
                let provider = results[0].itemProvider
                provider.loadFileRepresentation(forTypeIdentifier: UTType.movie.identifier) { url, error in
                    do {
                        guard let source = url else { throw error ?? ImagePipeline.Failure.invalidImage }
                        let copy = FileManager.default.temporaryDirectory.appendingPathComponent("LUMI-import-\(UUID().uuidString).\(source.pathExtension.isEmpty ? "mov" : source.pathExtension)")
                        try FileManager.default.copyItem(at: source, to: copy)
                        DispatchQueue.main.async { self.owner.onVideo(copy) }
                    } catch { DispatchQueue.main.async { self.owner.onError(error) } }
                }
                return
            }
            let group = DispatchGroup(), lock = NSLock()
            let maximum = owner.multiple ? 1400 : 4096
            var images: [(Int, UIImage)] = [], errors: [Error] = []
            for (index, result) in results.enumerated() {
                group.enter()
                result.itemProvider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { data, error in
                    defer { group.leave() }
                    do {
                        guard let data = data else { throw error ?? ImagePipeline.Failure.invalidImage }
                        let image = try ImagePipeline.decode(data, maximum: maximum)
                        lock.lock(); images.append((index, image)); lock.unlock()
                    } catch { lock.lock(); errors.append(error); lock.unlock() }
                }
            }
            group.notify(queue: .main) {
                if let error = errors.first { self.owner.onError(error); return }
                self.owner.onImages(images.sorted { $0.0 < $1.0 }.map { $0.1 })
            }
        }
    }
}
