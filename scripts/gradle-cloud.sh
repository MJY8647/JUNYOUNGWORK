#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export JAVA_HOME="${JAVA_HOME:-/workspace/toolchains/jdk-21.0.8+9}"
export ANDROID_HOME="${ANDROID_HOME:-/workspace/toolchains/android}"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-/workspace/toolchains/gradle-user-home}"
python3 - "$@" <<'PY'
import os,pathlib,shutil,subprocess,sys,urllib.parse
env=os.environ.copy();opts=[]
cert=env.get('CODEX_PROXY_CERT')
if cert and pathlib.Path(cert).is_file():
    trust=pathlib.Path(env['GRADLE_USER_HOME'])/'managed-cacerts';trust.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(pathlib.Path(env['JAVA_HOME'])/'lib/security/cacerts',trust)
    subprocess.run([str(pathlib.Path(env['JAVA_HOME'])/'bin/keytool'),'-importcert','-noprompt','-alias','managed-cloud-proxy','-file',cert,'-keystore',str(trust),'-storepass','changeit'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    opts+=['-Djavax.net.ssl.trustStore='+str(trust),'-Djavax.net.ssl.trustStorePassword=changeit']
proxy=urllib.parse.urlsplit(env.get('HTTPS_PROXY') or env.get('https_proxy') or '')
if proxy.hostname:
    for scheme in ('http','https'):opts+=['-D'+scheme+'.proxyHost='+proxy.hostname,'-D'+scheme+'.proxyPort='+str(proxy.port or 80)]
env['JAVA_TOOL_OPTIONS']=' '.join(filter(None,[env.get('JAVA_TOOL_OPTIONS','')]+opts))
sys.exit(subprocess.run(['./gradlew']+sys.argv[1:],env=env).returncode)
PY
