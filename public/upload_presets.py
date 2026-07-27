#!/usr/bin/env python3
"""Convert famous-beats-presets.js to JSON and upload it to Dropbox.

Workflow
--------
1. Edit famous-beats-presets.js (paste exported presets, tweak values, etc.)
2. Run:  python upload_presets.py
   - Converts JS → JSON
   - Uploads JSON to Dropbox via rclone, overwriting
     dropbox:/vercel/famous-beats-presets.json

NOTE: This OVERWRITES the Dropbox JSON with the local .js contents. Run
download_presets.py first if the browser may have appended beats you want
to keep. The Dropbox share link is per-file and survives overwrites, so
PRESETS_DROPBOX_URL never needs updating.

Requirements
------------
- node  (to evaluate the .js file)
- rclone configured with a Dropbox remote named "dropbox"

Usage
-----
  python upload_presets.py
  python upload_presets.py -i famous-beats-presets.js -d dropbox:/vercel
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path


DROPBOX_DIR   = 'dropbox:/vercel'
REMOTE_NAME   = 'famous-beats-presets.json'
DEFAULT_INPUT = 'famous-beats-presets.js'
OUTPUT_JSON   = 'famous-beats-presets.json'


def js_to_json(js_path: Path) -> list:
    """Evaluate the presets JS file with node and return the array as Python objects."""
    js_src = js_path.read_text(encoding='utf-8')
    node_script = js_src.replace('window.FAMOUS_BEATS_PRESETS', 'global.FAMOUS_BEATS_PRESETS')
    node_script += '\nprocess.stdout.write(JSON.stringify(global.FAMOUS_BEATS_PRESETS));\n'

    result = subprocess.run(['node', '-e', node_script], capture_output=True, text=True)
    if result.returncode != 0:
        print('node error:\n', result.stderr, file=sys.stderr)
        sys.exit(1)

    return json.loads(result.stdout)


def run(cmd: list[str], desc: str) -> str:
    """Run a command, print it, exit on failure, return stdout."""
    print(f'\n$ {" ".join(cmd)}')
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'{desc} failed:\n{result.stderr}', file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


def main():
    parser = argparse.ArgumentParser(
        description='Convert beat maker presets JS to JSON, upload to Dropbox, patch HTML'
    )
    parser.add_argument('-i', '--input', default=DEFAULT_INPUT,
                        help=f'Source JS file (default: {DEFAULT_INPUT})')
    parser.add_argument('-d', '--dropbox-dir', default=DROPBOX_DIR,
                        help=f'Dropbox destination directory (default: {DROPBOX_DIR})')
    args = parser.parse_args()

    js_path = Path(args.input)
    if not js_path.exists():
        print(f'Error: {js_path} not found', file=sys.stderr)
        sys.exit(1)

    # 1. Convert JS → JSON
    print(f'Reading {js_path} ...')
    presets = js_to_json(js_path)
    print(f'  {len(presets)} preset(s) found')

    # 2. Write JSON
    out_path = js_path.parent / OUTPUT_JSON
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(presets, f, indent=2, ensure_ascii=False)
    print(f'-> Wrote {out_path}')

    # 3. Upload to Dropbox (overwrites; share link is per-file so it never changes)
    remote_path = f'{args.dropbox_dir}/{REMOTE_NAME}'
    run(['rclone', 'copyto', str(out_path.resolve()), remote_path], 'rclone copyto')
    print(f'-> {out_path.name} has been copied over to {remote_path}')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
