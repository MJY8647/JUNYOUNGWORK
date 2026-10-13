#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
sdk="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [[ -z "$sdk" ]]; then echo 'Set ANDROID_HOME to an Android SDK with platform 35 and build-tools 35.0.0.' >&2; exit 1; fi
tools="$sdk/build-tools/35.0.0"
jar="$sdk/platforms/android-35/android.jar"
out=build/native
rm -rf "$out"
mkdir -p "$out/generated" "$out/classes" "$out/dex"
python3 - "$out" <<'PY'
import sys,xml.etree.ElementTree as E
E.register_namespace('android','http://schemas.android.com/apk/res/android')
t=E.parse('app/src/main/AndroidManifest.xml')
t.getroot().set('package','com.junyoung.lumi')
t.write(sys.argv[1]+'/AndroidManifest.xml',encoding='utf-8',xml_declaration=True)
PY
"$tools/aapt2" compile --dir app/src/main/res -o "$out/resources.zip"
"$tools/aapt2" link -o "$out/lumi-unsigned.apk" -I "$jar" --manifest "$out/AndroidManifest.xml" --java "$out/generated" --min-sdk-version 29 --target-sdk-version 35 --version-code 1 --version-name 0.1.0 "$out/resources.zip"
find app/src/main/java "$out/generated" -name '*.java' -print > "$out/sources.txt"
javac -encoding UTF-8 -source 17 -target 17 -classpath "$jar" -d "$out/classes" @"$out/sources.txt"
find "$out/classes" -name '*.class' -print > "$out/classes.txt"
"$tools/d8" --lib "$jar" --min-api 29 --output "$out/dex" @"$out/classes.txt"
python3 - "$out" <<'PY'
import sys,zipfile,pathlib
p=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(p/'lumi-unsigned.apk','a',zipfile.ZIP_DEFLATED) as z:
    for dex in (p/'dex').glob('*.dex'): z.write(dex,dex.name)
PY
"$tools/zipalign" -f -p 4 "$out/lumi-unsigned.apk" "$out/lumi-aligned.apk"
key="${LUMI_DEBUG_KEYSTORE:-$out/../lumi-debug.keystore}"
if [[ ! -f "$key" ]]; then keytool -genkeypair -keystore "$key" -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -dname 'CN=Android Debug,O=Lumi,C=KR'; fi
"$tools/apksigner" sign --ks "$key" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out "$out/LUMI-debug.apk" "$out/lumi-aligned.apk"
"$tools/apksigner" verify "$out/LUMI-debug.apk"
echo "APK: $PWD/$out/LUMI-debug.apk"
