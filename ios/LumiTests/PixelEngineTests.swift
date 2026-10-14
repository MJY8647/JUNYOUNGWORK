import XCTest
#if canImport(UIKit)
import UIKit
@testable import Lumi
#else
@testable import LumiPixels
#endif

final class PixelEngineTests: XCTestCase {
    func testNeutralPreservesOriginalAndAlpha() throws {
        let samples: [UInt32] = [0xff000000, 0xffffffff, 0xffa37b62, 0x8055bb77, 0xff0000ff]
        XCTAssertEqual(try PixelEngine.render(samples, width: 5, height: 1, settings: PixelSettings()), samples)
    }
    func testExposureBrightensMidtones() throws {
        var s = PixelSettings(); s.exposure = 0.5
        let source: [UInt32] = [0xffa37b62]
        let output = try PixelEngine.render(source, width: 1, height: 1, settings: s)
        XCTAssertGreaterThan((output[0] >> 16) & 255, (source[0] >> 16) & 255)
        XCTAssertEqual(source, [0xffa37b62])
    }
    func testMonoChannelsMatch() throws {
        var s = PixelSettings(); s.filter = 4; s.filterAmount = 1
        let p = try PixelEngine.render([0xffaa5533], width: 1, height: 1, settings: s)[0]
        XCTAssertEqual((p >> 16) & 255, (p >> 8) & 255); XCTAssertEqual((p >> 8) & 255, p & 255)
    }
    func testZeroFilterIntensityIsIdentity() throws {
        var s = PixelSettings(); s.filter = 1; s.filterAmount = 0
        XCTAssertEqual(try PixelEngine.render([0xffaa5533], width: 1, height: 1, settings: s), [0xffaa5533])
    }
    func testSkinSmoothingReducesNoise() throws {
        var seed: UInt64 = 13
        let skin: [UInt32] = (0..<961).map { _ in
            seed = seed &* 6364136223846793005 &+ 1
            let noise = Int((seed >> 32) % 17) - 8
            return 0xff000000 | UInt32(204 + noise) << 16 | UInt32(150 + noise) << 8 | UInt32(115 + noise)
        }
        var s = PixelSettings(); s.smooth = 1
        let output = try PixelEngine.render(skin, width: 31, height: 31, settings: s)
        func variance(_ pixels: [UInt32]) -> Double {
            pixels.reduce(0) { $0 + pow(Double(Int(($1 >> 16) & 255) - 204), 2) }
        }
        XCTAssertLessThan(variance(output), variance(skin) * 0.6)
    }
    func testNonSkinBlueStaysUnchanged() throws {
        let source = [UInt32](repeating: 0xff2255ee, count: 31 * 31)
        var s = PixelSettings(); s.smooth = 1
        XCTAssertEqual(try PixelEngine.render(source, width: 31, height: 31, settings: s), source)
    }
    func testStrongEdgesArePreserved() throws {
        let source: [UInt32] = (0..<961).map { $0 % 31 < 15 ? 0xffcc9673 : 0xff171717 }
        var s = PixelSettings(); s.smooth = 1
        let output = try PixelEngine.render(source, width: 31, height: 31, settings: s)
        XCTAssertLessThan(abs(Int((output[15 * 31 + 14] >> 16) & 255) - 204), 5)
        XCTAssertEqual(output[15 * 31 + 15], 0xff171717)
    }
    func testSpotHealingAndImmutableOriginal() throws {
        var source = [UInt32](repeating: 0xffcc9977, count: 441); source[220] = 0xff663322
        let result = try PixelEngine.retouch(source, width: 21, height: 21,
            edits: [BrushEdit(reshape: false, x: 0.5, y: 0.5, radius: 0.15)])
        XCTAssertEqual(result[220], 0xffcc9977); XCTAssertEqual(result[0], source[0]); XCTAssertEqual(source[220], 0xff663322)
    }
    func testZeroDisplacementIsIdentity() throws {
        let source: [UInt32] = (0..<441).map { 0xff000000 | UInt32($0 * 233) }
        XCTAssertEqual(try PixelEngine.retouch(source, width: 21, height: 21,
            edits: [BrushEdit(reshape: true, x: 0.5, y: 0.5, radius: 0.3)]), source)
    }
    func testLocalWarpKeepsBoundary() throws {
        var source = [UInt32](repeating: 0xffcc9977, count: 441); source[220] = 0xff663322
        let output = try PixelEngine.retouch(source, width: 21, height: 21,
            edits: [BrushEdit(reshape: true, x: 0.5, y: 0.5, radius: 0.3, dx: 0.05)])
        XCTAssertEqual(output[0], source[0]); XCTAssertNotEqual(output[220], source[220])
    }
    func testCancellationAndInvalidInput() {
        XCTAssertThrowsError(try PixelEngine.render([0xffffffff], width: 1, height: 1, settings: PixelSettings(), cancelled: { true }))
        XCTAssertThrowsError(try PixelEngine.render([0xffffffff], width: 2, height: 2, settings: PixelSettings()))
    }
    #if canImport(UIKit)
    func testPixelBridgeKeepsOpaquePixels() throws {
        let source: [UInt32] = [0xffff0000, 0xff00ff00, 0xff0000ff, 0xffffffff]
        let image = try ImagePipeline.image(source, 2, 2)
        let (output, w, h) = try ImagePipeline.pixelBuffer(image)
        XCTAssertEqual(w, 2); XCTAssertEqual(h, 2); XCTAssertEqual(output, source)
    }
    func testRotateAndCropDimensions() {
        let image = ImagePipeline.demo()
        var s = PhotoState(); s.turns = 1
        XCTAssertEqual(ImagePipeline.geometry(image, s).size, CGSize(width: 1100, height: 900))
        s.turns = 0; s.crop = 2
        XCTAssertEqual(ImagePipeline.geometry(image, s).size, CGSize(width: 880, height: 1100))
    }
    func testBrushCoordinateMapping() {
        var s = PhotoState(); s.turns = 1
        let source = CGSize(width: 900, height: 1100)
        XCTAssertEqual(ImagePipeline.originalPoint(CGPoint(x: 0, y: 0), original: source, state: s), CGPoint(x: 0, y: 1))
        s.flipped = true
        XCTAssertEqual(ImagePipeline.originalPoint(CGPoint(x: 0, y: 0), original: source, state: s), CGPoint(x: 1, y: 1))
        for turns in 0..<4 { for crop in 0..<4 {
            s.turns = turns; s.crop = crop
            XCTAssertEqual(ImagePipeline.originalPoint(CGPoint(x: 0.5, y: 0.5), original: source, state: s), CGPoint(x: 0.5, y: 0.5))
        } }
    }
    func testCollageSizes() {
        let photos = [ImagePipeline.demo(), ImagePipeline.demo()]
        XCTAssertEqual(ImagePipeline.collage(photos, layout: 0).size, CGSize(width: 2000, height: 2000))
        XCTAssertEqual(ImagePipeline.collage(photos, layout: 2).size, CGSize(width: 2000, height: 1200))
    }
    #endif
}
