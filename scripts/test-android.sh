#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${ANDROID_HOME:?Set ANDROID_HOME}"
tools="$ANDROID_HOME/build-tools/35.0.0"
adb="$ANDROID_HOME/platform-tools/adb"
out=build/device-tests
mkdir -p "$out/classes" "$out/dex" "$out/assets"
ffmpeg -hide_banner -loglevel error -y -f lavfi -i 'testsrc2=size=320x240:rate=24:duration=3' -f lavfi -i 'sine=frequency=440:duration=3' -c:v libx264 -pix_fmt yuv420p -g 24 -c:a aac -shortest "$out/assets/smoke-input.mp4"
"$tools/aapt2" link -o "$out/test-unsigned.apk" -I "$ANDROID_HOME/platforms/android-35/android.jar" --manifest tests/android/AndroidManifest.xml -A "$out/assets"
javac -encoding UTF-8 -source 17 -target 17 -classpath "$ANDROID_HOME/platforms/android-35/android.jar" -d "$out/classes" tests/android/SmokeRunner.java
find "$out/classes" -name '*.class' > "$out/classes.txt"
"$tools/d8" --lib "$ANDROID_HOME/platforms/android-35/android.jar" --min-api 29 --output "$out/dex" @"$out/classes.txt"
python3 - "$out" <<'PY'
import sys,zipfile,pathlib
p=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(p/'test-unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
    for dex in (p/'dex').glob('*.dex'):z.write(dex,dex.name)
PY
"$tools/zipalign" -f -p 4 "$out/test-unsigned.apk" "$out/test-aligned.apk"
"$tools/apksigner" sign --ks build/lumi-debug.keystore --ks-pass pass:android --out "$out/test.apk" "$out/test-aligned.apk"
"$adb" install --no-incremental -r build/native/LUMI-debug.apk
"$adb" install --no-incremental -r "$out/test.apk"
"$adb" shell am instrument -w com.junyoung.lumi.smoke/.SmokeRunner > "$out/results.txt"
cat "$out/results.txt"
python3 - "$out/results.txt" <<'PY'
import sys
text=open(sys.argv[1]).read()
assert 'PASS: 17 Android functional checks' in text and 'FAIL:' not in text, 'Device checks did not all pass'
PY
