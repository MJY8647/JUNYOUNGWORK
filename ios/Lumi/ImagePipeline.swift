import UIKit
import ImageIO
import Photos

struct PhotoState: Equatable {
    var pixels = PixelSettings()
    var turns = 0
    var flipped = false
    var crop = 0
    var caption = ""
    var frame = false
    var edits: [BrushEdit] = []
}

final class RenderCancellation: @unchecked Sendable {
    private let lock = NSLock()
    private var value = false
    func cancel() { lock.lock(); value = true; lock.unlock() }
    func isCancelled() -> Bool { lock.lock(); defer { lock.unlock() }; return value }
}

enum ImagePipeline {
    enum Failure: LocalizedError {
        case invalidImage, permission, saveFailed
        var errorDescription: String? {
            switch self {
            case .invalidImage: return "사진을 읽거나 처리하지 못했습니다. 다른 사진으로 다시 시도해 주세요."
            case .permission: return "사진 저장 권한이 없습니다. 설정 > LUMI > 사진에서 저장을 허용해 주세요."
            case .saveFailed: return "사진을 저장하지 못했습니다. 저장 공간과 사진 접근 권한을 확인해 주세요."
            }
        }
    }
    static func renderer(_ size: CGSize, opaque: Bool = false) -> UIGraphicsImageRenderer {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1; format.opaque = opaque; format.preferredRange = .standard
        return UIGraphicsImageRenderer(size: size, format: format)
    }
    static func decode(_ data: Data, maximum: Int = 4096, pixelLimit: Double = 6_000_000) throws -> UIImage {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let info = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any],
              let w = info[kCGImagePropertyPixelWidth] as? NSNumber,
              let h = info[kCGImagePropertyPixelHeight] as? NSNumber else { throw Failure.invalidImage }
        let long = max(w.doubleValue, h.doubleValue)
        let scale = min(1, min(Double(maximum) / long, sqrt(pixelLimit / (w.doubleValue * h.doubleValue))))
        let options: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: max(1, Int(long * scale)),
            kCGImageSourceShouldCacheImmediately: true
        ]
        guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else { throw Failure.invalidImage }
        return UIImage(cgImage: image)
    }
    static func scaled(_ image: UIImage, maximum: CGFloat) -> UIImage {
        let factor = min(1, maximum / max(image.size.width, image.size.height))
        if factor == 1 { return image }
        let size = CGSize(width: max(1, (image.size.width * factor).rounded()), height: max(1, (image.size.height * factor).rounded()))
        return renderer(size).image { _ in image.draw(in: CGRect(origin: .zero, size: size)) }
    }
    static func pixelBuffer(_ image: UIImage) throws -> ([UInt32], Int, Int) {
        guard let cg = image.cgImage else { throw Failure.invalidImage }
        let w = cg.width, h = cg.height
        var bytes = [UInt8](repeating: 0, count: w * h * 4)
        let success = bytes.withUnsafeMutableBytes { buffer -> Bool in
            guard let context = CGContext(data: buffer.baseAddress, width: w, height: h, bitsPerComponent: 8,
                bytesPerRow: w * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
                bitmapInfo: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue) else { return false }
            context.draw(cg, in: CGRect(x: 0, y: 0, width: CGFloat(w), height: CGFloat(h))); return true
        }
        guard success else { throw Failure.invalidImage }
        var pixels = [UInt32](repeating: 0, count: w * h)
        for i in pixels.indices {
            let j = i * 4, a = UInt32(bytes[j + 3])
            let r = a == 0 ? 0 : min(255, UInt32(bytes[j]) * 255 / a)
            let g = a == 0 ? 0 : min(255, UInt32(bytes[j + 1]) * 255 / a)
            let b = a == 0 ? 0 : min(255, UInt32(bytes[j + 2]) * 255 / a)
            pixels[i] = (a << 24) | (r << 16) | (g << 8) | b
        }
        return (pixels, w, h)
    }
    static func image(_ pixels: [UInt32], _ w: Int, _ h: Int) throws -> UIImage {
        var bytes = [UInt8](repeating: 0, count: pixels.count * 4)
        for (i, p) in pixels.enumerated() {
            let a = (p >> 24) & 255
            bytes[i * 4] = UInt8(((p >> 16) & 255) * a / 255)
            bytes[i * 4 + 1] = UInt8(((p >> 8) & 255) * a / 255)
            bytes[i * 4 + 2] = UInt8((p & 255) * a / 255)
            bytes[i * 4 + 3] = UInt8(a)
        }
        guard let provider = CGDataProvider(data: Data(bytes) as CFData),
              let cg = CGImage(width: w, height: h, bitsPerComponent: 8, bitsPerPixel: 32, bytesPerRow: w * 4,
                space: CGColorSpace(name: CGColorSpace.sRGB)!,
                bitmapInfo: CGBitmapInfo(rawValue: CGBitmapInfo.byteOrder32Big.rawValue | CGImageAlphaInfo.premultipliedLast.rawValue),
                provider: provider, decode: nil, shouldInterpolate: true, intent: .defaultIntent) else { throw Failure.invalidImage }
        return UIImage(cgImage: cg)
    }
    static func geometry(_ image: UIImage, _ state: PhotoState) -> UIImage {
        let original = image.size
        let size = state.turns % 2 == 0 ? original : CGSize(width: original.height, height: original.width)
        let transformed = renderer(size).image { context in
            context.cgContext.translateBy(x: size.width / 2, y: size.height / 2)
            context.cgContext.rotate(by: CGFloat(state.turns) * .pi / 2)
            context.cgContext.scaleBy(x: state.flipped ? -1 : 1, y: 1)
            image.draw(in: CGRect(x: -original.width / 2, y: -original.height / 2, width: original.width, height: original.height))
        }
        guard state.crop != 0 else { return transformed }
        let ratio: CGFloat = state.crop == 1 ? 1 : state.crop == 2 ? 0.8 : 16 / 9
        let w = min(size.width, size.height * ratio), h = min(size.height, size.width / ratio)
        let rect = CGRect(x: ((size.width - w) / 2).rounded(), y: ((size.height - h) / 2).rounded(), width: floor(w), height: floor(h))
        guard let cropped = transformed.cgImage?.cropping(to: rect) else { return transformed }
        return UIImage(cgImage: cropped)
    }
    static func originalPoint(_ point: CGPoint, original: CGSize, state: PhotoState) -> CGPoint {
        let size = state.turns % 2 == 0 ? original : CGSize(width: original.height, height: original.width)
        let ratio: CGFloat = state.crop == 1 ? 1 : state.crop == 2 ? 0.8 : 16 / 9
        let w = state.crop == 0 ? size.width : min(size.width, size.height * ratio)
        let h = state.crop == 0 ? size.height : min(size.height, size.width / ratio)
        let x = (point.x - 0.5) * w, y = (point.y - 0.5) * h
        let recovered: CGPoint
        switch state.turns % 4 {
        case 1: recovered = CGPoint(x: y, y: -x)
        case 2: recovered = CGPoint(x: -x, y: -y)
        case 3: recovered = CGPoint(x: -y, y: x)
        default: recovered = CGPoint(x: x, y: y)
        }
        return CGPoint(x: min(1, max(0, (state.flipped ? -recovered.x : recovered.x) / original.width + 0.5)),
                       y: min(1, max(0, recovered.y / original.height + 0.5)))
    }
    static func render(_ original: UIImage, state: PhotoState, token: RenderCancellation) throws -> UIImage {
        let (buffer, w, h) = try pixelBuffer(original)
        let pixels = try PixelEngine.render(buffer, width: w, height: h, settings: state.pixels,
                                            edits: state.edits, cancelled: token.isCancelled)
        let photo = geometry(try image(pixels, w, h), state)
        if token.isCancelled() { throw PixelError.cancelled }
        if state.caption.isEmpty && !state.frame { return photo }
        return renderer(photo.size).image { context in
            photo.draw(at: .zero)
            if state.frame {
                UIColor.white.setStroke(); context.cgContext.setLineWidth(min(photo.size.width, photo.size.height) * 0.045)
                context.cgContext.stroke(CGRect(origin: .zero, size: photo.size))
            }
            if !state.caption.isEmpty {
                let paragraph = NSMutableParagraphStyle(); paragraph.alignment = .center
                var fontSize = photo.size.width * 0.045
                while (state.caption as NSString).size(withAttributes: [.font: UIFont.boldSystemFont(ofSize: fontSize)]).width > photo.size.width * 0.85 { fontSize *= 0.9 }
                let shadow = NSShadow(); shadow.shadowColor = UIColor.black.withAlphaComponent(0.65)
                shadow.shadowBlurRadius = photo.size.width * 0.006; shadow.shadowOffset = CGSize(width: 0, height: 1)
                (state.caption as NSString).draw(in: CGRect(x: photo.size.width * 0.075, y: photo.size.height * 0.87,
                    width: photo.size.width * 0.85, height: fontSize * 1.5),
                    withAttributes: [.font: UIFont.boldSystemFont(ofSize: fontSize), .foregroundColor: UIColor.white,
                                     .paragraphStyle: paragraph, .shadow: shadow])
            }
        }
    }
    static func collage(_ photos: [UIImage], layout: Int) -> UIImage {
        let count = min(9, photos.count)
        let cols = layout == 1 ? 1 : layout == 2 ? count : Int(ceil(sqrt(Double(count))))
        let rows = Int(ceil(Double(count) / Double(cols)))
        let size = CGSize(width: 2000, height: CGFloat(layout == 1 ? min(3000, 1000 * count) : layout == 2 ? 1200 : 2000))
        return renderer(size, opaque: true).image { context in
            UIColor.white.setFill(); context.cgContext.fill(CGRect(origin: .zero, size: size))
            for n in 0..<count {
                let box = CGRect(x: CGFloat(n % cols) * size.width / CGFloat(cols) + 24,
                    y: CGFloat(n / cols) * size.height / CGFloat(rows) + 24,
                    width: size.width / CGFloat(cols) - 48, height: size.height / CGFloat(rows) - 48)
                let image = photos[n], scale = max(box.width / image.size.width, box.height / image.size.height)
                context.cgContext.saveGState(); context.cgContext.clip(to: box)
                image.draw(in: CGRect(x: box.midX - image.size.width * scale / 2, y: box.midY - image.size.height * scale / 2,
                                     width: image.size.width * scale, height: image.size.height * scale))
                context.cgContext.restoreGState()
            }
        }
    }
    static func demo() -> UIImage {
        renderer(CGSize(width: 900, height: 1100), opaque: true).image { context in
            let c = context.cgContext
            let colors = [UIColor(red: 0.71, green: 0.77, blue: 0.70, alpha: 1).cgColor,
                          UIColor(red: 0.91, green: 0.87, blue: 0.78, alpha: 1).cgColor] as CFArray
            let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1])!
            c.drawLinearGradient(gradient, start: .zero, end: CGPoint(x: 900, y: 1100), options: [])
            func oval(_ rect: CGRect, _ color: UIColor) { color.setFill(); UIBezierPath(ovalIn: rect).fill() }
            oval(CGRect(x: 505, y: 120, width: 300, height: 300), UIColor(red: 0.93, green: 0.93, blue: 0.86, alpha: 1))
            oval(CGRect(x: -200, y: 600, width: 1300, height: 1000), UIColor(red: 0.47, green: 0.54, blue: 0.45, alpha: 1))
            oval(CGRect(x: 180, y: 760, width: 530, height: 560), UIColor(red: 0.23, green: 0.34, blue: 0.27, alpha: 1))
            oval(CGRect(x: 220, y: 260, width: 460, height: 560), UIColor(red: 0.24, green: 0.20, blue: 0.17, alpha: 1))
            oval(CGRect(x: 295, y: 340, width: 300, height: 400), UIColor(red: 0.89, green: 0.71, blue: 0.56, alpha: 1))
            let fringe = UIBezierPath(); fringe.move(to: CGPoint(x: 280, y: 450)); fringe.addCurve(to: CGPoint(x: 625, y: 475), controlPoint1: CGPoint(x: 280, y: 190), controlPoint2: CGPoint(x: 630, y: 190)); fringe.addLine(to: CGPoint(x: 465, y: 360)); fringe.close(); UIColor.brown.withAlphaComponent(0.9).setFill(); fringe.fill()
            c.setStrokeColor(UIColor(red: 0.35, green: 0.25, blue: 0.2, alpha: 1).cgColor); c.setLineWidth(9)
            c.move(to: CGPoint(x: 345, y: 520)); c.addLine(to: CGPoint(x: 389, y: 516)); c.move(to: CGPoint(x: 495, y: 516)); c.addLine(to: CGPoint(x: 539, y: 520)); c.strokePath()
            c.setStrokeColor(UIColor(red: 0.7, green: 0.47, blue: 0.4, alpha: 1).cgColor); c.setLineWidth(7); c.move(to: CGPoint(x: 411, y: 642)); c.addLine(to: CGPoint(x: 473, y: 642)); c.strokePath()
            oval(CGRect(x: 70, y: 930, width: 265, height: 370), UIColor(red: 0.94, green: 0.91, blue: 0.86, alpha: 1))
            oval(CGRect(x: 710, y: 680, width: 300, height: 720), UIColor(red: 0.81, green: 0.85, blue: 0.71, alpha: 1))
        }
    }
    static func save(_ image: UIImage, completion: @escaping (Result<Void, Error>) -> Void) {
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else { completion(.failure(Failure.permission)); return }
            // Flatten transparency for the JPEG output, keeping the normalized source untouched.
            let flat = renderer(image.size, opaque: true).image { c in
                UIColor.white.setFill(); c.cgContext.fill(CGRect(origin: .zero, size: image.size)); image.draw(at: .zero)
            }
            guard let data = flat.jpegData(compressionQuality: 0.97) else { completion(.failure(Failure.saveFailed)); return }
            PHPhotoLibrary.shared().performChanges({
                let request = PHAssetCreationRequest.forAsset()
                request.addResource(with: .photo, data: data, options: nil)
            }, completionHandler: { success, error in
                if success { completion(.success(Void())) } else { completion(.failure(error ?? Failure.saveFailed)) }
            })
        }
    }
}
