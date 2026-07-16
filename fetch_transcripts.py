#!/usr/bin/env python3
"""
Fetch recent YouTube video transcripts and upload to Dropbox via rclone.

Usage:
    python fetch_transcripts.py "https://www.youtube.com/@channelname"
    python fetch_transcripts.py "https://www.youtube.com/@channelname" --count 5
    python fetch_transcripts.py "https://www.youtube.com/watch?v=VIDEO_ID"  # gets channel from video
    python fetch_transcripts.py --file channels.txt                        # one channel URL per line
    python fetch_transcripts.py --file channels.txt --count 3
"""

import argparse
import os
import re
import subprocess
import sys
import json
from datetime import datetime

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

DROPBOX_FOLDER = "dropbox:/blob_vercel_replacement/youtubetranscriptup"
LOCAL_TEMP_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_transcript_temp")


def get_channel_url_from_video(video_url):
    """Extract channel URL from a video URL using yt-dlp."""
    with yt_dlp.YoutubeDL({"quiet": True, "no_warnings": True}) as ydl:
        info = ydl.extract_info(video_url, download=False)
        channel_url = info.get("channel_url")
        if channel_url:
            return channel_url
        # Fallback: construct from uploader_id
        uploader_id = info.get("uploader_id") or info.get("channel_id")
        if uploader_id:
            return f"https://www.youtube.com/channel/{uploader_id}"
    raise ValueError(f"Could not determine channel from: {video_url}")


def get_recent_videos(channel_url, count=1):
    """Get the most recent videos from a channel."""
    # Ensure we're hitting the videos tab
    if "/videos" not in channel_url:
        channel_url = channel_url.rstrip("/") + "/videos"

    ydl_opts = {
        "extract_flat": True,
        "quiet": True,
        "no_warnings": True,
        "playlistend": count,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(channel_url, download=False)
        entries = info.get("entries", [])

    videos = []
    for entry in entries[:count]:
        videos.append({
            "id": entry.get("id"),
            "title": entry.get("title", "Untitled"),
            "url": f"https://www.youtube.com/watch?v={entry['id']}",
        })

    return videos


def get_transcript(video_id):
    """Fetch transcript for a video. Returns cleaned text or None."""
    try:
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id)
        lines = []
        for snippet in transcript.snippets:
            text = snippet.text.strip()
            if text:
                lines.append(text)
        return " ".join(lines)
    except Exception as e:
        print(f"  Could not get transcript for {video_id}: {e}")
        return None


def format_transcript_with_timestamps(video_id):
    """Fetch transcript with minute-based timestamps."""
    try:
        ytt = YouTubeTranscriptApi()
        transcript = ytt.fetch(video_id)
        output = []
        current_minute = -1
        current_lines = []

        for snippet in transcript.snippets:
            text = snippet.text.strip()
            if not text:
                continue
            minute = int(snippet.start // 60)
            if minute != current_minute:
                if current_lines:
                    output.append(f"[{current_minute}:00] " + " ".join(current_lines))
                current_minute = minute
                current_lines = [text]
            else:
                current_lines.append(text)

        if current_lines:
            output.append(f"[{current_minute}:00] " + " ".join(current_lines))

        return "\n\n".join(output)
    except Exception as e:
        print(f"  Could not get transcript for {video_id}: {e}")
        return None


def sanitize_filename(title):
    """Make a safe filename from a video title."""
    safe = re.sub(r'[^\w\s\-]', '', title)
    safe = re.sub(r'\s+', '_', safe.strip())
    return safe[:100]  # cap length


def save_and_upload(videos_with_transcripts):
    """Save transcripts as .txt files and upload to Dropbox via rclone."""
    os.makedirs(LOCAL_TEMP_DIR, exist_ok=True)

    saved_files = []
    for video in videos_with_transcripts:
        filename = sanitize_filename(video["title"]) + ".txt"
        filepath = os.path.join(LOCAL_TEMP_DIR, filename)

        content = f"Title: {video['title']}\n"
        content += f"URL: {video['url']}\n"
        content += f"Fetched: {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"
        content += f"{'=' * 60}\n\n"
        content += video["transcript"]

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)

        saved_files.append(filepath)
        print(f"  Saved: {filename}")

    if not saved_files:
        print("No files to upload.")
        return

    # Upload via rclone
    print(f"\nUploading to {DROPBOX_FOLDER}...")
    result = subprocess.run(
        ["rclone", "copy", LOCAL_TEMP_DIR, DROPBOX_FOLDER, "--progress"],
        capture_output=False,
    )

    if result.returncode == 0:
        print("Upload complete!")
    else:
        print(f"rclone failed with exit code {result.returncode}")

    # Clean up temp files
    for f in saved_files:
        os.remove(f)
    try:
        os.rmdir(LOCAL_TEMP_DIR)
    except OSError:
        pass


def main():
    parser = argparse.ArgumentParser(description="Fetch YouTube transcripts and upload to Dropbox")
    parser.add_argument("url", nargs="?", help="YouTube channel URL or video URL")
    parser.add_argument("--file", "-f", help="Text file with one channel/video URL per line")
    parser.add_argument("--count", "-n", type=int, default=1, help="Number of recent videos per channel (default: 1)")
    parser.add_argument("--timestamps", "-t", action="store_true", help="Include minute timestamps in transcript")
    args = parser.parse_args()

    if not args.url and not args.file:
        parser.error("Provide a URL or --file channels.txt")

    # Build list of URLs to process
    urls = []
    if args.file:
        with open(args.file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    urls.append(line)
        print(f"Loaded {len(urls)} channel(s) from {args.file}\n")
    else:
        urls.append(args.url.strip())

    all_videos_with_transcripts = []

    for i, url in enumerate(urls, 1):
        if len(urls) > 1:
            print(f"--- Channel {i}/{len(urls)} ---")

        # Detect if it's a video URL vs channel URL
        if "watch?v=" in url or "youtu.be/" in url:
            print(f"Detecting channel from video URL...")
            channel_url = get_channel_url_from_video(url)
            print(f"Channel: {channel_url}")
        else:
            channel_url = url

        print(f"Fetching {args.count} most recent video(s) from {channel_url}...")
        videos = get_recent_videos(channel_url, args.count)

        if not videos:
            print("No videos found.\n")
            continue

        print(f"Found {len(videos)} video(s):\n")

        for video in videos:
            print(f"  {video['title']}")
            print(f"  {video['url']}")

            if args.timestamps:
                transcript = format_transcript_with_timestamps(video["id"])
            else:
                transcript = get_transcript(video["id"])

            if transcript:
                video["transcript"] = transcript
                all_videos_with_transcripts.append(video)
                print(f"  Transcript: {len(transcript)} chars\n")
            else:
                print(f"  Transcript: UNAVAILABLE\n")

    if all_videos_with_transcripts:
        save_and_upload(all_videos_with_transcripts)
    else:
        print("No transcripts available for any videos.")


if __name__ == "__main__":
    main()
