#!/bin/bash
# transcribe_latest.sh
# Grabs the latest recording from Dropbox /recordings/vercel/ via rclone,
# transcribes it with whisper-cli, and copies the text to clipboard.
#
# Usage: ./transcribe_latest.sh
#
# Dependencies: rclone, whisper-cli (whisper-cpp), pbcopy (macOS)

set -euo pipefail

DROPBOX_REMOTE="dropbox:/recordings/vercel"
LOCAL_DIR="/tmp/vercel_recordings"
WHISPER_MODEL="/opt/homebrew/share/whisper-cpp/ggml-base.bin"

mkdir -p "$LOCAL_DIR"

# Find the latest file in the Dropbox folder (sorted by modification time)
echo "Fetching file list from $DROPBOX_REMOTE..."
LATEST_FILE=$(rclone lsf "$DROPBOX_REMOTE" --files-only -t --format "tp" | sort -r | head -n1 | sed 's/^[^;]*;//')

if [ -z "$LATEST_FILE" ]; then
    echo "No recordings found in $DROPBOX_REMOTE"
    exit 1
fi

echo "Latest recording: $LATEST_FILE"

# Download the latest file
echo "Downloading..."
rclone copy "$DROPBOX_REMOTE/$LATEST_FILE" "$LOCAL_DIR" --progress

LOCAL_PATH="$LOCAL_DIR/$LATEST_FILE"

if [ ! -f "$LOCAL_PATH" ]; then
    echo "Error: Failed to download $LATEST_FILE"
    exit 1
fi

echo "Transcribing with whisper-cli..."

# Run whisper-cli — outputs to <input>.txt with -otxt flag
/opt/homebrew/bin/whisper-cli \
    -m "$WHISPER_MODEL" \
    -f "$LOCAL_PATH" \
    --no-timestamps \
    -otxt \
    -l auto 2>/dev/null

# whisper-cli creates <file>.mp3.txt — rename to <file>.txt
TXT_FILE_OLD="${LOCAL_PATH}.txt"
TXT_FILE=$(echo "$LOCAL_PATH" | sed 's/\.[^.]*$/.txt/')
if [ -f "$TXT_FILE_OLD" ]; then
    mv "$TXT_FILE_OLD" "$TXT_FILE"
fi

if [ ! -f "$TXT_FILE" ]; then
    echo "Error: Transcription file not found"
    exit 1
fi

# Read and display the transcription
TRANSCRIPTION=$(cat "$TXT_FILE")
echo ""
echo "=== Transcription ==="
echo "$TRANSCRIPTION"
echo "====================="
echo ""

# Copy to clipboard (macOS)
echo "$TRANSCRIPTION" | pbcopy
echo "Transcription copied to clipboard!"
echo "Text file saved at: $TXT_FILE"
