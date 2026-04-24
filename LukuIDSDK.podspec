# SPDX-License-Identifier: Apache-2.0
Pod::Spec.new do |s|
  s.name             = "LukuIDSDK"
  s.version          = "1.0.2"
  s.summary          = "LukuID iOS SDK for device communication and .luku verification."
  s.description      = <<-DESC
LukuID iOS SDK for connecting to LukuID devices, parsing and verifying .luku
forensic evidence archives, and sharing the same verification model as the
other platform SDKs.
  DESC
  s.homepage         = "https://github.com/lukuid/sdk"
  s.license          = { :type => "Apache-2.0", :file => "LICENSE" }
  s.authors          = { "LukuID" => "hello@lukuid.com" }
  s.source           = { :git => "https://github.com/lukuid/sdk.git", :tag => "v#{s.version}" }
  s.swift_versions   = ["5.9"]
  s.ios.deployment_target = "15.0"
  s.osx.deployment_target = "12.0"
  s.source_files     = "src/ios/LukuIDSDK/Sources/LukuIDSDK/**/*.swift"
  s.requires_arc     = true

  s.dependency "ZIPFoundation", "~> 0.9"
  s.dependency "SwiftProtobuf", ">= 1.25.0", "< 2.0"
end
