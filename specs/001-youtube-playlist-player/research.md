# Research: YouTube Playlist Player

## 0. Playlist Generation Script

**Decision**: Copy `generate_playlists.py` from the bach-player extension
(`/Users/stanleytan/Documents/technical/github/extensions/bach-player/generate_playlists.py`)
into this project's root as `generate_playlists.py`. Run it once to produce `playlists.json`.

**Default command**:
```bash
python generate_playlists.py \
  -i /Users/stanleytan/Documents/technical/github/extensions/bach-player/playlists \
  -o playlists.json
```

**What the script does**:
- Walks the input directory; each subdirectory becomes a genre key.
- Each `.txt` file within a genre dir is parsed for YouTube URLs and optional timestamps.
- Supported line formats:
  - `Name, https://youtube.com/watch?v=ID` → album with optional chapter timestamps below
  - Bare `https://youtube.com/watch?v=ID` → uses filename stem as album name
  - `MM:SS Title` / `H:MM:SS Title` → chapter track within the current album
- Outputs the exact `PlaylistMap` schema the player expects.

**Rationale**: The script already exists and handles all edge cases (encoding, multiple entries
per file, Dropbox filenames, YouTube ID extraction). Copying it avoids re-implementing logic.
No pip dependencies — pure Python stdlib.

**Alternatives considered**:
- Hard-code the source path in the script — rejected (user may move the bach-player repo).
- Bundle `playlists.json` in the git repo — rejected (gets stale; defeats the purpose of
  having a live Dropbox source).

---

## 1. API Proxy Pattern (YOUTUBE_PLAYLISTS_URL)

**Decision**: Implement `/api/playlists.js` as a thin Vercel serverless function that reads
`process.env.DROPBOX_PLAYLISTS_URL`, fetches it with `redirect: 'follow'`, and returns the
JSON response. Cache header: `s-maxage=60, stale-while-revalidate=300`.

**Rationale**: Identical to `/api/paths.js` in `vercel_clipboard_manager`. Server-side fetch
avoids browser CORS restrictions on Dropbox direct-download URLs. The env var is set via
`vercel env add YOUTUBE_PLAYLISTS_URL` — no secrets in source.
Note: existing `api/playlists.js` already uses `YOUTUBE_PLAYLISTS_URL` (not `DROPBOX_PLAYLISTS_URL`).

**Dropbox URL format**: Dropbox shared links ending in `?dl=1` (or `?raw=1` for Paper docs)
return raw file bytes. Alternatively, `dl.dropboxusercontent.com` links work directly.
`redirect: 'follow'` handles any intermediate redirects.

**Alternatives considered**:
- Bundle `playlists.json` in `public/` — rejected because updating playlists would require a
  new Vercel deployment every time.
- Full Dropbox OAuth — rejected (out of scope; the existing `dropbox_transcripts.html` already
  has that flow if needed in the future).

---

## 2. YouTube Embed (iframe)

**Decision**: Use the standard YouTube iframe embed URL:
`https://www.youtube.com/embed/{youtubeId}?autoplay=1`

For chapter/track seeks: append `&start={seconds}`.

**Rationale**: No API key required. No YouTube IFrame API JS library needed for the core use
case (just updating `iframe.src` on click is sufficient). This keeps the page dependency-free.

**Alternatives considered**:
- YouTube IFrame Player API (`YT.Player`) — provides richer events (onStateChange, seek
  without reload) but requires an async library load and callback plumbing. Rejected for now
  as YAGNI; updating `src` is simpler and sufficient.

---

## 3. Sidebar Layout

**Decision**: CSS Grid two-column layout — fixed-width left sidebar (~260px), fluid right
player column. Sidebar scrolls independently (`overflow-y: auto`). Dark theme matching the
existing project style (`#1a1a2e` background, `#c9a84c` accent).

**Genre grouping**: Collapsible `<details>`/`<summary>` elements — one per genre. No extra JS
needed for open/close. Matches the project's YAGNI principle.

**Alternatives considered**:
- Flat alphabetical list — loses the genre grouping that makes the bach-player useful.
- Tab-based genre switcher — more JS complexity; `<details>` is native and accessible.

---

## 4. Keyboard Navigation

**Decision**: `keydown` listener on `document`. `↑`/`↓` move a cursor through a flat list of
all album elements in DOM order. `Enter` triggers click on the focused album element. Focused
element gets an `aria-selected="true"` attribute and CSS highlight.

**Rationale**: Keeps keyboard nav simple (no focus management library). The flat list means
arrows cross genre boundaries seamlessly — same behavior as pressing Tab through list items.

---

## 5. Playlists JSON Schema (from bach-player)

Confirmed schema from `/Users/stanleytan/Documents/technical/github/extensions/bach-player/playlists.json`:

```json
{
  "genre_key": [
    {
      "name": "Album display name",
      "youtubeId": "VIDEO_ID",
      "tracks": [
        { "time": "0:00", "seconds": 0, "title": "Track title" }
      ]
    }
  ]
}
```

`tracks` may be an empty array `[]` — treat as "no chapters". `youtubeId` is always present
but may be an empty string in malformed entries — handle gracefully.
