#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Uso: $0 <diretorio-de-imagens> <audio-ou-silencio.wav> <legendas.srt> [saida.mp4]" >&2
  exit 2
fi

IMAGE_DIR="$1"
AUDIO_FILE="$2"
SUBTITLE_FILE="$3"
OUTPUT_FILE="${4:-content-package.mp4}"

command -v ffmpeg >/dev/null || { echo "ffmpeg não encontrado" >&2; exit 1; }
[[ -d "$IMAGE_DIR" ]] || { echo "Diretório de imagens não encontrado: $IMAGE_DIR" >&2; exit 1; }
[[ -f "$AUDIO_FILE" ]] || { echo "Áudio não encontrado: $AUDIO_FILE" >&2; exit 1; }
[[ -f "$SUBTITLE_FILE" ]] || { echo "Legendas não encontradas: $SUBTITLE_FILE" >&2; exit 1; }

mapfile -t IMAGES < <(find "$IMAGE_DIR" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) | sort)
[[ ${#IMAGES[@]} -gt 0 ]] || { echo "Nenhuma imagem PNG/JPG encontrada" >&2; exit 1; }

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
{
  for image in "${IMAGES[@]}"; do
    printf "file '%s'\\nduration 5\\n" "$(realpath "$image")"
  done
  printf "file '%s'\\n" "$(realpath "${IMAGES[${#IMAGES[@]}-1]}")"
} > "$TMP_DIR/concat.txt"

# Cada imagem recebe cinco segundos; o áudio define a duração final.
ffmpeg -y -hide_banner -loglevel error \
  -f concat -safe 0 -i "$TMP_DIR/concat.txt" -i "$AUDIO_FILE" \
  -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,subtitles=$SUBTITLE_FILE" \
  -r 30 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$OUTPUT_FILE"

echo "Vídeo criado em: $OUTPUT_FILE"
echo "Revisar direitos, áudio, legendas e visibilidade antes do upload manual."
