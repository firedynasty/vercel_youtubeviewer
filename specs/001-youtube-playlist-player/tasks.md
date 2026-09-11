# Tasks: YouTube Playlist Player

**Input**: Design documents from `/specs/001-youtube-playlist-player/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Environment configuration and project wiring — no source files yet.

- [x] T000 Copy `generate_playlists.py` from the bach-player extension into the repo root — **DONE** (see Phase 0.5 below)
- [ ] T001 Run `python generate_playlists.py -i /Users/stanleytan/Documents/technical/github/extensions/bach-player/playlists -o playlists.json` from repo root; copy the output `playlists.json` to Dropbox; get the `?dl=1` share link; add to `.env.local` as `YOUTUBE_PLAYLISTS_URL=<link>` — **MANUAL STEP**
- [x] T002 Confirm `api/` directory exists at repo root; create it if absent — **DONE** (`api/` already exists)

**Checkpoint**: Local env var is set; `api/` directory is present.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: The API proxy must exist before the HTML page can fetch data. All user story
work depends on this completing first.

**⚠️ CRITICAL**: No user story work can begin until T003 is verified working.

- [x] T003 Create `api/playlists.js` — **DONE** (file already existed using `YOUTUBE_PLAYLISTS_URL`; functionally identical to spec)

**Checkpoint**: `curl http://localhost:3000/api/playlists` returns valid JSON with genre keys.

---

## Phase 3: User Story 1 — Browse and play a playlist album (Priority: P1) 🎯 MVP

**Goal**: Sidebar shows all genres and albums; clicking an album loads the YouTube video in
the embedded player; active album is highlighted.

**Independent Test**: Open `public/youtube-playlist-player.html`, verify sidebar renders
multiple genre sections with albums, click an album, confirm the YouTube iframe updates and
the album row is highlighted.

### Implementation for User Story 1

- [x] T004 [US1] Create `public/youtube-playlist-player.html` with two-column CSS Grid layout — **DONE**
- [x] T005 [US1] Add YouTube `<iframe id="yt-frame">` placeholder — **DONE**
- [x] T006 [US1] Implement `loadPlaylists()` — **DONE**
- [x] T007 [US1] Implement `renderSidebar(playlists)` with `<details>` genre groups — **DONE**
- [x] T008 [US1] Implement `selectAlbum(albumEl)` — **DONE**
- [x] T009 [US1] Wire sidebar click event delegation — **DONE**

**Checkpoint**: User Story 1 fully functional — sidebar renders, click plays video, active item highlighted.

---

## Phase 4: User Story 2 — Navigate chapters / tracks within an album (Priority: P2)

**Goal**: Albums with a non-empty `tracks` array show a clickable chapter list below the
iframe; clicking a track seeks the video to the correct timestamp.

**Independent Test**: Click the "brainwave" album (adhd genre — has 12+ tracks). Verify a
track list appears below the iframe. Click "14Hz Beta Focus" — iframe reloads with `?start=99&autoplay=1`.

### Implementation for User Story 2

- [x] T010 [US2] Add `#track-list` container div — **DONE**
- [x] T011 [US2] Implement `renderTrackList()` — **DONE**
- [x] T012 [US2] Call `renderTrackList()` from `selectAlbum()` — **DONE**
- [x] T013 [US2] Wire `#track-list` click event delegation — **DONE**

**Checkpoint**: User Stories 1 AND 2 functional — track list appears for chapter albums, clicking a track seeks correctly.

---

## Phase 5: User Story 3 — Keyboard navigation (Priority: P3)

**Goal**: `↑`/`↓` keys move selection through the flat album list; `Enter` loads the selected
album in the iframe.

**Independent Test**: Load the page, press `↓` 5 times — 5th album in flat DOM order is highlighted; press `Enter` — that album's video loads.

### Implementation for User Story 3

- [x] T014 [US3] Add `keydown` listener (↑/↓/Enter) on `document` — **DONE**
- [x] T015 [US3] Implement `highlightCursor()` with `.cursor` CSS distinct from `.active` — **DONE**

**Checkpoint**: All three user stories functional. Keyboard arrows navigate, Enter loads video.

---

## Phase 7: User Story 4 — Collapsible panels + mobile layout (Priority: P2)

**Goal**: Each panel has a toggle button; desktop collapses panel to 36px strip; mobile stacks panels below player as collapsed accordions on load.

- [x] T019 [US4] Add collapse toggle button to `#sidebar-header` in `public/youtube-playlist-player.html` — **DONE**
- [x] T020 [US4] Add collapse toggle button to `#track-list-header` in `public/youtube-playlist-player.html` — **DONE**
- [x] T021 [US4] Add CSS `#sidebar.collapsed` / `#track-list.collapsed` desktop states (36px strip) — **DONE**
- [x] T022 [US4] Add `updateDesktopGrid()` to update `grid-template-columns` on toggle — **DONE**
- [x] T023 [US4] Add mobile CSS media query (≤768px): flexbox column, player on top, panels below — **DONE**
- [x] T024 [US4] Collapse both panels on mobile at startup; tap header to toggle accordion — **DONE**

---

## Phase 8: User Story 5 — 30s loop controls (Priority: P2)

**Goal**: Loop control bar below player: timestamp input, ⏱️ 30s / ⏹️ N/40 button, pause/resume. Uses YouTube IFrame Player API for seek and volume.

- [x] T025 [US5] Migrate from `iframe.src` to YouTube IFrame Player API (`YT.Player`) in `public/youtube-playlist-player.html` — **DONE** (uses `loadVideoById`, `seekTo`, `setVolume`, `getVolume`, `getCurrentTime`)
- [x] T026 [US5] Add `#loop-controls` HTML section (timestamp input, loop button, pause button, status span) — **DONE**
- [x] T027 [US5] Port loop engine from yt-controls: `fadeVolTo`, `runT3Loop`, `cancelT3`, `toggleT3`, `toggleT3Pause` — **DONE** (adapted to use `ytSetVolume`/`ytGetVolume` 0–100 scale)
- [x] T028 [US5] Wire loop button click → `toggleT3`; pause button → `toggleT3Pause` — **DONE**

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, environment wiring, and validation against quickstart.md.

- [x] T016 [P] Quickstart env var docs — **DONE** (quickstart.md already covers `YOUTUBE_PLAYLISTS_URL` setup; updated env var name note in T001)
- [ ] T017 Validate all 7 quickstart.md scenarios (S-1 through S-7) manually in the browser — **MANUAL: run `vercel dev` and test**
- [x] T018 [P] Add nav link in `public/index.html` — **DONE** (▶ Playlist link added to Quick Nav Links section)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 (API proxy must return data)
- **US2 (Phase 4)**: Depends on Phase 3 (needs `selectAlbum()` and iframe already wired)
- **US3 (Phase 5)**: Depends on Phase 3 (needs `allAlbums[]` flat list and `selectAlbum()`)
- **Polish (Phase 6)**: Depends on Phases 3–5

### Within Phase 3 (US1)

T004 → T005 → T006 → T007 → T008 → T009 (sequential; each builds on the prior DOM)

### Parallel Opportunities

- T001 + T002 can run together (Phase 1)
- T014 + T015 can run together (Phase 5 — both touch the same file but are independent logic blocks; merge carefully)
- T016 + T018 can run together (Phase 6)

---

## Parallel Example: Phase 1

```
Task T001: Add DROPBOX_PLAYLISTS_URL to .env.local
Task T002: Confirm/create api/ directory
→ Both have no dependencies; run simultaneously
```

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Phase 1: Setup (T001, T002)
2. Phase 2: Foundational — `api/playlists.js` (T003)
3. Phase 3: US1 — sidebar + iframe + click (T004–T009)
4. **STOP and VALIDATE**: `curl /api/playlists` returns JSON; sidebar renders; clicking plays video
5. Ship as MVP — the core playlist player loop is complete

### Incremental Delivery

1. MVP complete (US1) → functional player
2. Add US2 (T010–T013) → chapter navigation unlocked
3. Add US3 (T014–T015) → keyboard nav added
4. Polish (T016–T018) → nav link + validation

---

## Notes

- All tasks touch `public/youtube-playlist-player.html` (a new file) or `api/playlists.js` (a new file); no existing files are modified except adding a nav link in Phase 6 (T018)
- `data-tracks` on `.album-item` elements: store as `JSON.stringify(album.tracks)` during `renderSidebar()`; parse back in `selectAlbum()` to avoid a second lookup into the `playlists` object
- YouTube embed autoplay requires the iframe to be on a page served over HTTPS or localhost — `vercel dev` satisfies this
