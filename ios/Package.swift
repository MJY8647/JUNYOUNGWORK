// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "LumiPixels",
    products: [.library(name: "LumiPixels", targets: ["LumiPixels"])],
    targets: [
        .target(name: "LumiPixels", path: "Lumi",
                exclude: ["LumiApp.swift", "LumiView.swift", "ImagePipeline.swift", "PhotoModel.swift",
                          "PhotoPicker.swift", "VideoEditor.swift", "Assets.xcassets"], sources: ["PixelEngine.swift"]),
        .testTarget(name: "LumiPixelsTests", dependencies: ["LumiPixels"], path: "LumiTests")
    ]
)
