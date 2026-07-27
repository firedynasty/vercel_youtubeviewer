#!/usr/bin/env python3
"""Download famous-beats-presets.json from Dropbox and convert it back to JS.

Reverse of upload_presets.py. Use this to sync the local .js with beats
appended from the browser (Save / Export -> Append to Dropbox) BEFORE editing
by hand or running upload_presets.py — otherwise the upload will clobber
browser-saved beats.

Workflow
--------
1. Browser: Save / Export -> Append to Dropbox (appends to the JSON)
2. Run:  python download_presets.py
   - Downloads JSON from Dropbox via rclone
   - Backs up existing famous-beats-presets.js to famous-beats-presets.js.bak
   - Regenerates famous-beats-presets.js from the JSON

Requirements
------------
- node    (to syntax-check the generated .js)
- rclone configured with a Dropbox remote named "dropbox"

Usage
-----
  python download_presets.py
  python download_presets.py -d dropbox:/vercel -o famous-beats-presets.js
"""

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


DROPBOX_DIR    = 'dropbox:/vercel'
REMOTE_NAME    = 'famous-beats-presets.json'
LOCAL_JSON     = 'famous-beats-presets.json'
DEFAULT_OUTPUT = 'famous-beats-presets.js'

HEADER = '''// famous-beats-presets.js
// GENERATED from the Dropbox JSON by download_presets.py.
// Add beats via the beat maker (Save / Export -> Append to Dropbox), then re-run
// download_presets.py to re-sync this file. Hand edits are fine too, but run
// upload_presets.py afterwards to push them back to Dropbox.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  var STEPS = 16;

  function pattern(steps) {
    var arr = new Array(STEPS).fill(0);
    steps.forEach(function (s) { arr[s] = 1; });
    return arr;
  }

  window.FAMOUS_BEATS_PRESETS = [
'''

FOOTER = '''  ];
})();
'''

TRACKS = ['kick', 'snare', 'hat', 'crash', 'tone']


def run(cmd: list[str], desc: str) -> str:
    """Run a command, print it, exit on failure, return stdout."""
    print(f'\n$ {" ".join(cmd)}')
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f'{desc} failed:\n{result.stderr}', file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


def indices(arr: list) -> str:
    """Convert a 16-step 0/1 array to an index list for pattern([...])."""
    return ','.join(str(i) for i, v in enumerate(arr) if v)


def preset_to_js(p: dict) -> str:
    """Render one preset object in the same style as the original .js file."""
    lines = [
        '    {',
        f'      name: {json.dumps(p.get("name", "Untitled"), ensure_ascii=False)},',
        f'      bpm: {p.get("bpm", 120)},',
        f'      desc: {json.dumps(p.get("desc", ""), ensure_ascii=False)},',
    ]
    for t in TRACKS:
        comma = ',' if t != TRACKS[-1] else ''
        lines.append(f'      {t}: pattern([{indices(p.get(t) or [])}]){comma}')
    lines.append('    }')
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(
        description='Download presets JSON from Dropbox and convert back to famous-beats-presets.js'
    )
    parser.add_argument('-d', '--dropbox-dir', default=DROPBOX_DIR,
                        help=f'Dropbox source directory (default: {DROPBOX_DIR})')
    parser.add_argument('-o', '--output', default=DEFAULT_OUTPUT,
                        help=f'Output JS file (default: {DEFAULT_OUTPUT})')
    args = parser.parse_args()

    json_path = Path(LOCAL_JSON)

    # 1. Download JSON from Dropbox
    remote_path = f'{args.dropbox_dir}/{REMOTE_NAME}'
    run(['rclone', 'copyto', remote_path, str(json_path.resolve())], 'rclone copyto')
    print(f'-> Downloaded {remote_path}')

    # 2. Load JSON
    presets = json.loads(json_path.read_text(encoding='utf-8'))
    print(f'  {len(presets)} preset(s) found')

    # 3. Back up existing JS before overwriting (hand-written comments, local
    #    edits not yet in Dropbox — recoverable from the .bak if needed)
    out_path = Path(args.output)
    if out_path.exists():
        backup = out_path.with_name(out_path.name + '.bak')
        shutil.copy2(out_path, backup)
        print(f'-> Backed up existing {out_path} to {backup}')

    # 4. Generate JS
    body = ',\n'.join(preset_to_js(p) for p in presets)
    out_path.write_text(HEADER + body + '\n' + FOOTER, encoding='utf-8')
    print(f'-> Wrote {out_path}')

    # 5. Syntax-check the generated file
    run(['node', '--check', str(out_path)], 'node --check')
    print('-> node syntax check passed')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
