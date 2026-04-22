// swift-tools-version: 5.9
// SPDX-License-Identifier: Apache-2.0
import PackageDescription

let package = Package(
    name: "LukuIDSDK",
platforms: [
        .iOS(.v15),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "LukuIDSDK",
            targets: ["LukuIDSDK"]
        )
    ],
    dependencies: [
        .package(url: "https://github.com/weichsel/ZIPFoundation.git", .upToNextMajor(from: "0.9.0")),
        .package(url: "https://github.com/apple/swift-protobuf.git", from: "1.25.0")
    ],
    targets: [
        .target(
            name: "LukuIDSDK",
            dependencies: [
                .product(name: "ZIPFoundation", package: "ZIPFoundation"),
                .product(name: "SwiftProtobuf", package: "swift-protobuf")
            ],
            path: "Sources/LukuIDSDK"
        ),
        .testTarget(
            name: "LukuIDSDKTests",
            dependencies: ["LukuIDSDK"],
            path: "Tests/LukuIDSDKTests"
        )
    ]
)
