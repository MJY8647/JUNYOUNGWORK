#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(uname -s)" != Darwin ]]; then
    echo 'Xcode build and iOS simulator tests require macOS.' >&2
    exit 1
fi
command -v xcodebuild >/dev/null
simulator_id="${LUMI_IOS_SIMULATOR_ID:-}"
if [[ -z "$simulator_id" ]]; then
    simulator_id="$(xcrun simctl list devices available -j | python3 -c 'import sys,json; data=json.load(sys.stdin); phones=[d for ds in data["devices"].values() for d in ds if d.get("isAvailable") and "iPhone" in d["name"]]; assert phones, "Install an iOS simulator runtime in Xcode Settings > Components"; print(phones[0]["udid"])')"
fi
mkdir -p build/ios
run_path="$(mktemp -d "$PWD/build/ios/run.XXXXXX")"
xcodebuild -project ios/Lumi.xcodeproj -scheme Lumi -configuration Debug \
    -destination "platform=iOS Simulator,id=$simulator_id" \
    -derivedDataPath build/ios/DerivedData -resultBundlePath "$run_path/LumiTests.xcresult" \
    CODE_SIGNING_ALLOWED=NO test
echo "Test result: $run_path/LumiTests.xcresult"
