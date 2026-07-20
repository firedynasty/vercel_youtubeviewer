#!/usr/bin/env python3
"""Convert famous-beats-presets.js to JSON and print rclone upload commands.

Workflow
--------
1. Edit famous-beats-presets.js (paste exported presets, tweak values, etc.)
2. Run:  python upload_presets.py
3. Copy and run the printed rclone commands to upload to Dropbox.
4. Go to Vercel dashboard → Project Settings → Environment Variables
   and update BEATS_DROPBOX_URL with the shareable link (append &raw=1).

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


def main():
    parser = argparse.ArgumentParser(
        description='Convert beat maker presets JS to JSON and print rclone commands'
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

    # 2. Write JSON next to the JS file
    out_path = js_path.parent / OUTPUT_JSON
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(presets, f, indent=2, ensure_ascii=False)
    print(f'\n-> Wrote {out_path}')

    # 3. Print rclone commands
    remote_path = f'{args.dropbox_dir}/{REMOTE_NAME}'
    print(f'\nrclone copyto {out_path.resolve()} {remote_path}')
    print(f'rclone link {remote_path}')
    print(f'\n# Then update Vercel with the link (append &raw=1):')
    print(f'vercel env rm BEATS_DROPBOX_URL production -y')
    print(f'echo "<LINK>&raw=1" | vercel env add BEATS_DROPBOX_URL production')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
