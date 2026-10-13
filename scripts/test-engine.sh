#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p build/engine-tests
javac -d build/engine-tests app/src/main/java/com/junyoung/lumi/PhotoEngine.java tests/PhotoEngineTest.java
java -cp build/engine-tests PhotoEngineTest
