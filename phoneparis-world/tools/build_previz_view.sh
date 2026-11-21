#!/bin/sh
# 렌더가 끝난 프리비즈 구간을 previz-view/v 에 인코딩하고 ready.js 갱신
S=${1:-/tmp/claude-0/-home-user-JUNYOUNGWORK/9d0c8afe-4077-52df-ac93-8a4c66731849/scratchpad/pvall2}
O=$(dirname "$0")/../previz-view
for d in "$S"/*/; do n=$(basename "$d"); [ "$(ls "$d" | wc -l)" -ge 144 ] && [ ! -f "$O/v/$n.mp4" ] && ffmpeg -v error -y -framerate 24 -i "$d/f%04d.jpg" -an -c:v libx264 -crf 24 -pix_fmt yuv420p -movflags +faststart "$O/v/$n.mp4"; done
printf 'window.READY = [%s];\n' "$(ls "$O/v" | sed 's/\.mp4$//' | sed 's/.*/"&"/' | paste -sd, -)" > "$O/ready.js"
cat "$O/ready.js"
