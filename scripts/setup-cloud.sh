#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export LUMI_TOOLCHAIN_ROOT="${LUMI_TOOLCHAIN_ROOT:-/workspace/toolchains}"
python3 - <<'PY'
import hashlib,os,pathlib,shutil,subprocess,tarfile,zipfile
root=pathlib.Path(os.environ['LUMI_TOOLCHAIN_ROOT']);root.mkdir(parents=True,exist_ok=True)
sdk=root/'android'
def download(url,name,algorithm,expected):
    target=root/name
    if not target.exists():subprocess.run(['curl','--fail','--location','--silent','--show-error',url,'-o',str(target)],check=True)
    with target.open('rb') as f:
        digest=hashlib.new(algorithm)
        while chunk:=f.read(1024*1024):digest.update(chunk)
    if digest.hexdigest()!=expected:raise RuntimeError('Checksum mismatch: '+name)
    return target
# Checksums are pinned from Google's official repository2-1.xml over verified TLS.
packages=[('platform-35_r02.zip','0bb560a90a7a2cbd0dd8348224d518b638fe7949','platforms/android-35'),('build-tools_r35_linux.zip','2cfaa0bbb2336e9ec18ed3ecea84fa2e2af607bc','build-tools/35.0.0'),('platform-tools_r37.0.1-linux.zip','477254aa5f903c15cf51001717bdf347fb6b53e0','platform-tools')]
for name,digest,dest in packages:
    target=sdk/dest
    if target.is_dir():continue
    archive=download('https://dl.google.com/android/repository/'+name,name,'sha1',digest)
    tmp=root/(name+'.unpack');tmp.mkdir(exist_ok=True)
    with zipfile.ZipFile(archive) as z:
        z.extractall(tmp)
        for item in z.infolist():
            p=tmp/item.filename
            if p.is_file() and item.external_attr>>16:os.chmod(p,(item.external_attr>>16)&0o777)
    target.parent.mkdir(parents=True,exist_ok=True);shutil.move(str(next(tmp.iterdir())),target);tmp.rmdir()
for name in ('aapt2','d8','apksigner','zipalign'):(sdk/'build-tools/35.0.0'/name).chmod(0o755)
(sdk/'platform-tools/adb').chmod(0o755)
jdk=root/'jdk-21.0.8+9'
if not jdk.exists():
    base='https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.8%2B9/'
    name='OpenJDK21U-jdk_x64_linux_hotspot_21.0.8_9.tar.gz'
    checksum=root/'temurin.sha256'
    subprocess.run(['curl','-fsSL',base+name+'.sha256.txt','-o',str(checksum)],check=True)
    archive=download(base+name,name,'sha256',checksum.read_text().split()[0])
    with tarfile.open(archive) as t:t.extractall(root,filter='data')
print('Toolchain ready:',jdk,sdk)
PY
export JAVA_HOME="$LUMI_TOOLCHAIN_ROOT/jdk-21.0.8+9"
export ANDROID_HOME="$LUMI_TOOLCHAIN_ROOT/android"
export PATH="$JAVA_HOME/bin:$PATH"
./scripts/test-engine.sh
./scripts/build-android.sh
