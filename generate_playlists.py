#!/usr/bin/env python3
"""Generate playlists.json from .txt files in playlist/ directory.

Each .txt file becomes a category (filename stem = key).
Each line in a .txt file: name,url  OR  just url (name auto-derived).

Usage:
  python generate_playlists.py
  python generate_playlists.py -i playlist -o public/playlists.json
"""

import argparse
import json
import re
from pathlib import Path


def parse_playlist_file(filepath):
    entries = []
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            # Check for quoted value: name,"url,time1,time2(label),..."
            m = re.match(r'^([^,]*),\s*"(.+)"$', line)
            if m:
                name = m.group(1).strip()
                inner = m.group(2).strip()
                parts = [p.strip() for p in inner.split(',')]
                url = parts[0]
                times = []
                for t in parts[1:]:
                    if not t:
                        continue
                    tm = re.match(r'^([\d:]+)\s*(?:\(([^)]*)\))?(.*)$', t)
                    if tm:
                        time_str = tm.group(1)
                        label = (tm.group(2) or '').strip()
                        entry = {'time': time_str}
                        if label:
                            entry['label'] = label
                        times.append(entry)
            else:
                parts = line.split(',', 1)
                if len(parts) == 2:
                    name = parts[0].strip()
                    rest = parts[1].strip()
                else:
                    rest = parts[0].strip()
                    name = ''
                url = rest
                times = []
                # Check if rest contains inline timestamps after URL
                is_url = bool(re.match(r'^https?://', rest))
                if is_url:
                    url_and_times = rest.split(',')
                    trailing_times = []
                    i = len(url_and_times) - 1
                    while i > 0:
                        candidate = url_and_times[i].strip()
                        if re.match(r'^\d{1,2}:\d{2}', candidate):
                            trailing_times.insert(0, candidate)
                            i -= 1
                        else:
                            break
                    if trailing_times:
                        url = ','.join(url_and_times[:i + 1])
                        for t in trailing_times:
                            tm = re.match(r'^([\d:]+)\s*(?:\(([^)]*)\))?(.*)$', t)
                            if tm:
                                tentry = {'time': tm.group(1)}
                                label = (tm.group(2) or '').strip()
                                if label:
                                    tentry['label'] = label
                                times.append(tentry)
            if not url:
                continue
            if not name:
                # Derive name from URL
                name = url.rstrip('/').split('/')[-1]
                name = name.split('?')[0]
                if '.' in name:
                    name = name.rsplit('.', 1)[0]
                name = name.replace('_', ' ').replace('-', ' ').strip()
            entry = {'name': name, 'url': url}
            if times:
                entry['times'] = times
            entries.append(entry)
    return entries


def main():
    parser = argparse.ArgumentParser(description='Generate playlists.json from .txt files')
    parser.add_argument('-i', '--input', default='playlist',
                        help='Input folder containing .txt files (default: playlist)')
    parser.add_argument('-o', '--output', default='public/playlists.json',
                        help='Output JSON file (default: public/playlists.json)')
    args = parser.parse_args()

    input_dir = Path(args.input)
    if not input_dir.is_dir():
        print(f'No {input_dir}/ directory found.')
        return 1

    txt_files = sorted(input_dir.glob('*.txt'))
    if not txt_files:
        print(f'No .txt files found in {input_dir}')
        return 1

    playlists = {}
    for txt_file in txt_files:
        category = txt_file.stem
        entries = parse_playlist_file(txt_file)
        playlists[category] = entries
        print(f'  {category}: {len(entries)} item(s)')

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(playlists, f, indent=2, ensure_ascii=False)

    print(f'\n-> Wrote {len(playlists)} categories to {output_path}')

    # Print commands to sync to Dropbox and update Vercel env var
    base = Path(__file__).resolve().parent / 'public'
    print(f'\nrclone copyto {base / "playlists.json"}  dropbox:/vercel/youtube_playlist.json')
    print(f'rclone link dropbox:/vercel/youtube_playlist.json')
    print(f'\n# Then update Vercel with the link (append &raw=1):')
    print(f'vercel env rm YOUTUBE_PLAYLISTS_URL production -y')
    print(f'echo "<LINK>&raw=1" | vercel env add YOUTUBE_PLAYLISTS_URL production')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
