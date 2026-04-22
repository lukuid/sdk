#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
set -euo pipefail

PACKAGE_DIR=${1:-"src/ios/LukuIDSDK"}
OUTPUT_DIR=${2:-"$PACKAGE_DIR/.build-artifacts"}
SCHEME=${SCHEME:-"LukuIDSDK"}
ARCHIVE_ROOT="$OUTPUT_DIR/archives"
DERIVED_DATA="$OUTPUT_DIR/derived-data"

locate_framework() {
  local archive_path="$1"
  local scheme="$2"
  
  echo "Searching for $scheme.framework in $archive_path" >&2

  # Try to find any .framework directory inside the Products folder
  local found=""
  found=$(find "$archive_path/Products" -type d -name "${scheme}.framework" -print -quit)
  
  if [[ -n "$found" ]]; then
    echo "$found"
    return 0
  fi

  # Fallback: find any .framework at all
  found=$(find "$archive_path/Products" -type d -name "*.framework" -print -quit)
  if [[ -n "$found" ]]; then
    echo "$found"
    return 0
  fi

  echo "error: no .framework produced inside $archive_path" >&2
  echo "== content of $archive_path ==" >&2
  find "$archive_path" -maxdepth 5 >&2
  exit 1
}

if [[ ! -d "$PACKAGE_DIR" ]]; then
  echo "Package directory $PACKAGE_DIR does not exist" >&2
  exit 1
fi

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
# ARCHIVE_ROOT and DERIVED_DATA will be created by xcodebuild

pushd "$PACKAGE_DIR" >/dev/null

echo "Archiving for iOS device..."
xcodebuild \
  archive \
  -scheme "$SCHEME" \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_ROOT/ios-archive" \
  -configuration Release \
  -derivedDataPath "$DERIVED_DATA" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES

echo "Archiving for iOS simulator..."
xcodebuild \
  archive \
  -scheme "$SCHEME" \
  -destination 'generic/platform=iOS Simulator' \
  -archivePath "$ARCHIVE_ROOT/iossim-archive" \
  -configuration Release \
  -derivedDataPath "$DERIVED_DATA" \
  SKIP_INSTALL=NO \
  BUILD_LIBRARY_FOR_DISTRIBUTION=YES

IOS_ARCHIVE="$ARCHIVE_ROOT/ios-archive.xcarchive"
SIM_ARCHIVE="$ARCHIVE_ROOT/iossim-archive.xcarchive"

IOS_FRAMEWORK=$(locate_framework "$IOS_ARCHIVE" "$SCHEME")
SIM_FRAMEWORK=$(locate_framework "$SIM_ARCHIVE" "$SCHEME")

echo "Using device framework: $IOS_FRAMEWORK"
echo "Using simulator framework: $SIM_FRAMEWORK"

xcodebuild \
  -create-xcframework \
  -framework "$IOS_FRAMEWORK" \
  -framework "$SIM_FRAMEWORK" \
  -output "$OUTPUT_DIR/${SCHEME}.xcframework"

popd >/dev/null

echo "XCFramework created at $OUTPUT_DIR/${SCHEME}.xcframework"
