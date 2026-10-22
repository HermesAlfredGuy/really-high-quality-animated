#!/usr/bin/env bash
# Mux, encode and package THE LITTLE LIGHTHOUSE for delivery.
#   bash tools/deliver.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out media

SIL=out/silent-1080p.mp4
AUD=out/audio.wav
MASTER=out/the-little-lighthouse-1080p.mp4
SHARE=media/film-720p.mp4

echo "== mux master"
ffmpeg -v error -y -i "$SIL" -i "$AUD" \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -tune animation \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -shortest "$MASTER"

echo "== share copy (720p)"
ffmpeg -v error -y -i "$MASTER" -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p -profile:v high \
  -c:a aac -b:a 160k -movflags +faststart "$SHARE"

echo "== 1080p web copy (if it fits under 45 MB)"
cp "$MASTER" media/film-1080p.mp4
sz=$(stat -c%s media/film-1080p.mp4)
if [ "$sz" -gt 46000000 ]; then
  ffmpeg -v error -y -i "$MASTER" -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
    -c:a aac -b:a 192k -movflags +faststart media/film-1080p.mp4
fi

echo "== poster"
ffmpeg -v error -y -ss 6.4 -i "$MASTER" -frames:v 1 -vf "scale=1600:-2" media/poster.jpg

echo "== sizes"
ls -l "$MASTER" "$SHARE" media/film-1080p.mp4 media/poster.jpg | awk '{printf "%-42s %6.1f MB\n", $9, $5/1048576}'
for f in "$MASTER" "$SHARE"; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  s=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$f")
  l=$(ffmpeg -hide_banner -nostats -i "$f" -af ebur128=framelog=quiet -f null - 2>&1 | awk '/^ *I:/{print $2; exit}')
  printf "%-42s %ss  %s  %s LUFS\n" "$(basename "$f")" "$d" "$s" "${l:-no audio}"
done
