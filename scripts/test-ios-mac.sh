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
set +e
xcodebuild -project ios/Lumi.xcodeproj -scheme Lumi -configuration Debug \
    -destination "platform=iOS Simulator,id=$simulator_id" \
    -derivedDataPath build/ios/DerivedData -resultBundlePath "$run_path/LumiTests.xcresult" \
    CODE_SIGNING_ALLOWED=NO test 2>&1 | tee "$run_path/xcodebuild.log"
xcode_status=${PIPESTATUS[0]}
set -e
if [[ "$xcode_status" -ne 0 ]]; then
    if [[ "${GITHUB_ACTIONS:-}" == true ]]; then
        python3 - "$run_path/xcodebuild.log" <<'PY'
import pathlib,sys
lines=pathlib.Path(sys.argv[1]).read_text(errors='replace').splitlines()
errors=[line for line in lines if 'error:' in line.lower() or 'could not' in line.lower() or 'failed to' in line.lower()]
for line in (errors or lines[-10:])[:20]:
    message=line[:1800].replace('%','%25').replace('\r','%0D').replace('\n','%0A')
    print('::error title=iOS build diagnostic::'+message)
PY
    fi
    exit "$xcode_status"
fi
echo "Test result: $run_path/LumiTests.xcresult"
