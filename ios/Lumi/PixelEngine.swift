import Foundation

struct PixelSettings: Equatable {
    var smooth: Float = 0
    var exposure: Float = 0
    var contrast: Float = 0
    var saturation: Float = 0
    var warmth: Float = 0
    var highlights: Float = 0
    var vignette: Float = 0
    var filterAmount: Float = 0.7
    var filter: Int = 0
}

struct BrushEdit: Equatable {
    var reshape: Bool
    var x: Float
    var y: Float
    var radius: Float
    var dx: Float = 0
    var dy: Float = 0
}

enum PixelError: Error { case invalidDimensions, cancelled }

/// Straight-alpha 0xAARRGGBB pixels. The original buffer is never mutated.
enum PixelEngine {
    private static func clamp(_ x: Float) -> Float { max(0, min(1, x)) }
    private static func byte(_ x: Float) -> UInt32 { UInt32((clamp(x) * 255).rounded()) }
    private static func channels(_ p: UInt32) -> (Float, Float, Float) {
        (Float((p >> 16) & 255), Float((p >> 8) & 255), Float(p & 255))
    }
    private static func pack(_ p: UInt32, _ r: Float, _ g: Float, _ b: Float) -> UInt32 {
        (p & 0xff000000) | (byte(r / 255) << 16) | (byte(g / 255) << 8) | byte(b / 255)
    }
    static func render(_ source: [UInt32], width: Int, height: Int,
                       settings s: PixelSettings, edits: [BrushEdit] = [],
                       cancelled: () -> Bool = { false }) throws -> [UInt32] {
        guard width > 0, height > 0, width <= Int.max / height,
              source.count == width * height else { throw PixelError.invalidDimensions }
        var base = try retouch(source, width: width, height: height, edits: edits, cancelled: cancelled)
        if s.smooth > 0 { base = try smooth(base, width, height, s.smooth, cancelled) }
        var out = [UInt32](repeating: 0, count: source.count)
        let gain = pow(Float(2), s.exposure * 1.4), contrast = 1 + s.contrast * 0.65
        for y in 0..<height {
            if cancelled() { throw PixelError.cancelled }
            for x in 0..<width {
                let i = y * width + x, p = base[i], (rr, gg, bb) = channels(p)
                var r = rr / 255 * gain, g = gg / 255 * gain, b = bb / 255 * gain
                var l = 0.2126 * r + 0.7152 * g + 0.0722 * b
                let hi = s.highlights * 0.35 * clamp((l - 0.45) / 0.55)
                r = (r - hi - 0.5) * contrast + 0.5
                g = (g - hi - 0.5) * contrast + 0.5
                b = (b - hi - 0.5) * contrast + 0.5
                l = 0.2126 * r + 0.7152 * g + 0.0722 * b
                let sat = 1 + s.saturation * 0.8
                r = l + (r - l) * sat + s.warmth * 0.09
                g = l + (g - l) * sat + s.warmth * 0.015
                b = l + (b - l) * sat - s.warmth * 0.09
                var fr = r, fg = g, fb = b
                switch s.filter {
                case 1: fr = r * 1.04 + 0.025; fg = g * 1.01 + 0.015; fb = b * 0.93 + 0.02
                case 2: fr = r * 0.96 + 0.02; fg = g * 1.02 + 0.02; fb = b * 1.06 + 0.025
                case 3: fr = 0.08 + r * 0.86; fg = 0.055 + g * 0.88; fb = 0.045 + b * 0.86
                case 4: fr = clamp(l * 1.08 - 0.035); fg = fr; fb = fr
                default: break
                }
                r += (fr - r) * s.filterAmount
                g += (fg - g) * s.filterAmount
                b += (fb - b) * s.filterAmount
                let dx = (Float(x) - Float(width) * 0.5) / (Float(width) * 0.5)
                let dy = (Float(y) - Float(height) * 0.5) / (Float(height) * 0.5)
                let v = 1 - s.vignette * 0.45 * clamp((dx * dx + dy * dy) * 0.5)
                out[i] = (p & 0xff000000) | (byte(r * v) << 16) | (byte(g * v) << 8) | byte(b * v)
            }
        }
        return out
    }
    static func retouch(_ source: [UInt32], width w: Int, height h: Int,
                        edits: [BrushEdit], cancelled: () -> Bool = { false }) throws -> [UInt32] {
        guard w > 0, h > 0, w <= Int.max / h, source.count == w * h else { throw PixelError.invalidDimensions }
        var pixels = source
        for edit in edits {
            if cancelled() { throw PixelError.cancelled }
            var out = pixels
            let cx = edit.x * Float(w - 1), cy = edit.y * Float(h - 1)
            let radius = max(2, edit.radius * Float(min(w, h)))
            let left = max(0, Int(cx - radius)), right = min(w - 1, Int(cx + radius))
            let top = max(0, Int(cy - radius)), bottom = min(h - 1, Int(cy + radius))
            guard left <= right, top <= bottom else { continue }
            var meanR: Float = 0, meanG: Float = 0, meanB: Float = 0
            if !edit.reshape {
                for k in 0..<48 {
                    let angle = Float(k) * .pi / 24
                    let x = max(0, min(w - 1, Int((cx + cos(angle) * radius * 1.12).rounded())))
                    let y = max(0, min(h - 1, Int((cy + sin(angle) * radius * 1.12).rounded())))
                    let (r, g, b) = channels(pixels[y * w + x])
                    meanR += r; meanG += g; meanB += b
                }
                meanR /= 48; meanG /= 48; meanB /= 48
            }
            for y in top...bottom {
                if cancelled() { throw PixelError.cancelled }
                for x in left...right {
                    let ux = Float(x) - cx, uy = Float(y) - cy
                    let d = (ux * ux + uy * uy) / (radius * radius)
                    if d >= 1 { continue }
                    let weight = (1 - d) * (1 - d), i = y * w + x, p = pixels[i]
                    if edit.reshape {
                        let sx = max(0, min(Float(w - 1), Float(x) - edit.dx * Float(w) * weight))
                        let sy = max(0, min(Float(h - 1), Float(y) - edit.dy * Float(h) * weight))
                        let x0 = Int(sx), y0 = Int(sy), x1 = min(w - 1, x0 + 1), y1 = min(h - 1, y0 + 1)
                        let fx = sx - Float(x0), fy = sy - Float(y0)
                        var value: UInt32 = 0
                        for shift in stride(from: 0, through: 24, by: 8) {
                            let a = Float((pixels[y0 * w + x0] >> shift) & 255) * (1 - fx) +
                                Float((pixels[y0 * w + x1] >> shift) & 255) * fx
                            let b = Float((pixels[y1 * w + x0] >> shift) & 255) * (1 - fx) +
                                Float((pixels[y1 * w + x1] >> shift) & 255) * fx
                            value |= UInt32((a * (1 - fy) + b * fy).rounded()) << shift
                        }
                        out[i] = value
                    } else {
                        let blend = min(1, weight * 1.8), (r, g, b) = channels(p)
                        out[i] = pack(p, r + (meanR - r) * blend, g + (meanG - g) * blend, b + (meanB - b) * blend)
                    }
                }
            }
            pixels = out
        }
        return pixels
    }
    private static func smooth(_ src: [UInt32], _ w: Int, _ h: Int, _ amount: Float,
                               _ cancelled: () -> Bool) throws -> [UInt32] {
        var out = src
        let radius = max(2, min(7, Int((Float(min(w, h)) / 240).rounded())))
        let step = radius > 4 ? 2 : 1, side = 2 * radius + 1
        var spatial = [Float](repeating: 0, count: side * side)
        for dy in -radius...radius { for dx in -radius...radius {
            spatial[(dy + radius) * side + dx + radius] = exp(-Float(dx * dx + dy * dy) / Float(2 * radius * radius))
        } }
        let range = (0..<766).map { exp(-Float($0 * $0) / (2 * 48 * 48)) }
        for y in 0..<h {
            if cancelled() { throw PixelError.cancelled }
            for x in 0..<w {
                let i = y * w + x, p = src[i], (r, g, b) = channels(p)
                let cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
                let cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
                let mask = clamp((cr - 130) / 12) * clamp((180 - cr) / 12) *
                    clamp((cb - 75) / 12) * clamp((135 - cb) / 12) * clamp((r - 35) / 30)
                if mask == 0 { continue }
                var rr: Float = 0, gg: Float = 0, bb: Float = 0, sum: Float = 0
                for dy in stride(from: -radius, through: radius, by: step) {
                    for dx in stride(from: -radius, through: radius, by: step) {
                        let nx = max(0, min(w - 1, x + dx)), ny = max(0, min(h - 1, y + dy))
                        let (qr, qg, qb) = channels(src[ny * w + nx])
                        let d = Int(abs(qr - r) + abs(qg - g) + abs(qb - b))
                        let weight = spatial[(dy + radius) * side + dx + radius] * range[d]
                        rr += qr * weight; gg += qg * weight; bb += qb * weight; sum += weight
                    }
                }
                let mix = amount * 0.85 * mask
                if sum > 0 { out[i] = pack(p, r + (rr / sum - r) * mix, g + (gg / sum - g) * mix, b + (bb / sum - b) * mix) }
            }
        }
        return out
    }
}
