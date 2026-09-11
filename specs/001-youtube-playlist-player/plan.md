# Implementation Plan: YouTube Playlist Player

**Branch**: `001-youtube-playlist-player` | **Date**: 2026-09-10 | **Spec**: `specs/001-youtube-playlist-player/spec.md`

**Input**: Feature specification from `/specs/001-youtube-playlist-player/spec.md`

## Summary

Build a simplified YouTube playlist player page for Vercel deployment. The data pipeline is:
1. **Generate** — run `generate_playlists.py` (a copy of the bach-player script) pointing at
   the bach-player `playlists/` text files to produce a `playlists.json` file locally.
2. **Upload** — user manually copies the generated `playlists.json` to Dropbox and gets the
   raw share link (direct-download URL).
3. **Serve** — set `YOUTUBE_PLAYLISTS_URL` in Vercel env; the `/api/playlists` proxy route
   fetches and returns it to the browser.
4. **Play** — `youtube-playlist-player.html` (sidebar + YouTube iframe) fetches from
   `/api/playlists` and renders the playlist navigator.

No beats maker, no Dropbox OAuth, no Chrome APIs — just text-file → JSON → Dropbox → player.

## Technical Context

**Language/Version**: Python 3 for generator script; HTML5 + vanilla JS (ES2020) for the page; Node.js 24 for the API route

**Primary Dependencies**: Python stdlib only (no pip installs); no new npm packages

**Storage**: Dropbox public share link (raw JSON fetch via server-side proxy); no database

**Testing**: Manual browser testing (no automated test framework)

**Target Platform**: Vercel (Fluid Compute for API route, static HTML served from `public/`)

**Project Type**: CLI data generator + web page + Vercel serverless API route

**Performance Goals**: Playlist sidebar visible within 2s; video playback starts within 2s of click

**Constraints**: Generator script must be runnable with `python generate_playlists.py` from repo root;
`YOUTUBE_PLAYLISTS_URL` must be the only required env var for the live player

**Scale/Scope**: Personal use; single user; playlist JSON is tens of KB at most

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-Pipeline Authority | PASS | Playlist data flows from Dropbox → API proxy → page; no hard-coded content |
| II. Modular, Self-Contained Sections | PASS | New page is independent; does not depend on other pages' runtime state |
| III. Accessibility by Default | PASS | Keyboard navigation (↑/↓/Enter) is a named requirement (FR-008) |
| IV. No Over-Engineering (YAGNI) | PASS | Vanilla HTML/JS, no new frameworks or abstractions |
| V. Vercel-Native Deployment | PASS | API route pattern mirrors existing clipboard manager; env var via `vercel env` |

No gate failures. No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/001-youtube-playlist-player/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
generate_playlists.py       # NEW: copied from bach-player extension; generates playlists.json
                            #      from playlists/ text files. Run once to update the data.
                            #      Default input: extensions/bach-player/playlists/

api/
└── playlists.js            # EXISTS: server-side proxy; reads YOUTUBE_PLAYLISTS_URL env var

public/
└── youtube-playlist-player.html  # EXISTS: single-file player UI (sidebar + iframe + track list)
```

### Data Flow

```
bach-player/playlists/**/*.txt
        │
        ▼ python generate_playlists.py -i <path> -o playlists.json
playlists.json  (local, generated)
        │
        ▼ user manually copies to Dropbox → gets ?dl=1 share link
Dropbox (remote host)
        │
        ▼ YOUTUBE_PLAYLISTS_URL env var → vercel env add
/api/playlists  (Vercel proxy route)
        │
        ▼ fetch('/api/playlists')
youtube-playlist-player.html (browser)
```
