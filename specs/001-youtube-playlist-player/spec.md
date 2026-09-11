# Feature Specification: YouTube Playlist Player

**Feature Branch**: `001-youtube-playlist-player`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: "there is a lot of pages and features that I don't really need, I think the best way is that I get a simplified version of /Users/stanleytan/Documents/technical/github/extensions/bach-player so I get a list and sidebar of like playlist so I can click and it will trigger / play the youtube div"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and play a playlist album (Priority: P1)

A user opens the player page, sees a sidebar listing all playlist categories (e.g., Classical,
Worship, Deepwork Focus) and the albums within each category. The user clicks an album name and
the corresponding YouTube video loads in the embedded player immediately.

**Why this priority**: This is the entire core loop. Without it, the page has no value.

**Independent Test**: Open `youtube-playlist-player.html` in a browser. Verify the sidebar
renders at least two categories with albums. Click an album — the YouTube embed updates.

**Acceptance Scenarios**:

1. **Given** the page has loaded, **When** the user opens it, **Then** all genres and their
   albums appear in the sidebar.
2. **Given** the sidebar is visible, **When** the user clicks an album, **Then** the YouTube
   iframe `src` updates to `https://www.youtube.com/embed/{youtubeId}?autoplay=1`.
3. **Given** the user clicks an album, **When** the video loads, **Then** the clicked album
   item is visually highlighted as active.

---

### User Story 2 - Navigate chapters / tracks within an album (Priority: P2)

Some albums have named tracks with timestamps (chapters). When such an album is selected, a
track list appears below the player. Clicking a track seeks the video to the correct timestamp.

**Why this priority**: The bach-player already stores this data; exposing it upgrades the
player from a simple link launcher to a proper chapter navigator.

**Independent Test**: Select the "brainwave" album (adhd category — has chapters). Verify a
track list appears. Click a track and confirm the iframe loads the video with `?start=N`.

**Acceptance Scenarios**:

1. **Given** an album with tracks is selected, **When** the track list renders, **Then** each
   track shows its title and the active track is highlighted.
2. **Given** the track list is visible, **When** the user clicks a track, **Then** the iframe
   reloads with `?start={seconds}&autoplay=1`.
3. **Given** an album with no tracks is selected, **When** the album loads, **Then** no track
   list is shown.

---

### User Story 3 - Keyboard navigation (Priority: P3)

The user can navigate albums using keyboard arrows without touching the mouse.

**Why this priority**: Consistent with the project's Accessibility by Default principle and
the user's existing keyboard-centric navigation patterns.

**Independent Test**: Load the page, press `↓` several times — selected album advances. Press
`Enter` — video loads.

**Acceptance Scenarios**:

1. **Given** the page is focused, **When** the user presses `↓` / `↑`, **Then** the sidebar
   selection moves down / up through albums.
2. **Given** an album is selected via keyboard, **When** the user presses `Enter`, **Then**
   the video loads in the iframe.

---

### Edge Cases

- What happens when the `/api/playlists` endpoint fails or `DROPBOX_PLAYLISTS_URL` is unset?
  → Show a visible error message in the player area with a retry button; sidebar stays empty.
- What happens for albums where `youtubeId` is missing or empty? → The album still appears in
  the sidebar but clicking it shows a "No video available" message instead of loading the iframe.
- What if an album has tracks but no `youtubeId`? → Same as above — tracks cannot be played
  without a video ID.
- What if the Dropbox link is a redirect URL (e.g., `?dl=0` instead of `?dl=1`)? → The
  server-side proxy follows redirects automatically; the raw JSON is returned regardless.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A Vercel serverless API route (`/api/playlists`) MUST proxy the URL stored in
  the `DROPBOX_PLAYLISTS_URL` environment variable and return the parsed JSON. This mirrors
  the pattern in `/api/paths.js` from the clipboard manager project.
- **FR-002**: The HTML page MUST fetch playlist data from `/api/playlists` on load (not from
  a bundled local file), so the Dropbox JSON is the live source of truth.
- **FR-003**: Page MUST render a sidebar listing all genres; within each genre, all album names.
- **FR-004**: Clicking an album MUST update the YouTube iframe `src` to embed the album's
  `youtubeId` with `autoplay=1`.
- **FR-005**: If an album has a non-empty `tracks` array, the page MUST render a clickable
  track list below the iframe after the album is selected.
- **FR-006**: Clicking a track MUST reload the iframe with `?start={seconds}&autoplay=1`.
- **FR-007**: The active album MUST be visually highlighted in the sidebar.
- **FR-008**: Page MUST support `↑`/`↓` keyboard navigation for album selection and `Enter`
  to load the selected album.
- **FR-009**: The `YOUTUBE_PLAYLISTS_URL` value MUST be managed via `vercel env` and MUST NOT
  be hard-coded in source files.
- **FR-010**: A Python script (`generate_playlists.py`) MUST be provided in this project that
  reads the bach-player playlist `.txt` files from a configurable input directory and writes a
  `playlists.json` file the user can copy to Dropbox. Default input:
  `/Users/stanleytan/Documents/technical/github/extensions/bach-player/playlists`.
- **FR-011**: The generation script MUST accept `-i <dir>` (input playlists directory) and
  `-o <file>` (output JSON path) arguments so the source path is not hard-coded.
- **FR-012**: The generated `playlists.json` MUST follow the exact schema used by the player:
  `{ [genre]: Album[] }` where each Album has `name`, `youtubeId`, and `tracks`.

### Key Entities

- **Genre**: A named category (e.g., `"classical"`) containing an ordered list of albums.
- **Album**: A named entry with a `youtubeId` and an optional `tracks` array.
- **Track**: A chapter within an album: `title`, `seconds` (offset), and optional `time` label.
- **YOUTUBE_PLAYLISTS_URL**: Vercel environment variable holding the raw Dropbox share link
  to the `playlists.json` file (e.g., `https://www.dropbox.com/s/xxx/playlists.json?dl=1`).

## User Story 4 — Collapsible panels + mobile layout (Priority: P2 update)

On desktop the three-column layout stays, but each panel (Playlists, Tracks) has a toggle
button to collapse/expand it. On mobile (≤768px) the layout switches to single-column: player
on top, Playlists and Tracks panels stacked below as collapsible accordions.

**Acceptance Scenarios**:
1. **Given** desktop view, **When** user clicks the collapse toggle on the Playlists panel,
   **Then** the panel hides and the player column expands to fill the space.
2. **Given** mobile view (≤768px), **When** the page loads, **Then** the YouTube player takes
   full width on top and both panels appear below as collapsed accordions.
3. **Given** mobile view, **When** user taps a panel header, **Then** it expands/collapses.

---

### User Story 5 — 30s loop controls (Priority: P2 update)

A loop control bar below the YouTube player provides:
- A timestamp input (HH:MM:SS) showing the loop-back point
- A start/stop button (⏱️ 30s → ⏹️ N/40 while running)
- A pause/resume button (hidden until loop starts)

Loop behaviour matches yt-controls: play 30s, fade volume out over 2s, seek back to timestamp,
fade volume in, repeat 40 times total.

**Acceptance Scenarios**:
1. **Given** a video is playing, **When** user clicks the loop button, **Then** current
   timestamp is captured in the input, loop counter shows "⏹️ 1/40", and after 30s the video
   seeks back and increments to "⏹️ 2/40".
2. **Given** loop is running, **When** user clicks Pause, **Then** loop stops; clicking Resume
   captures current video position as the new loop-back point and continues counting.
3. **Given** loop is running, **When** user clicks the button again, **Then** loop is cancelled
   and the button resets to "⏱️ 30s".
4. **Given** 40 loops complete, **Then** button resets and a "Done ✓" flash appears.

---

## Out of Scope

- Beats Maker panel
- White noise generator
- Full Dropbox OAuth flow
- Chrome extension APIs (`chrome.storage`, `chrome.tabs`, `chrome.runtime`)
- Audio-only playback (`.m4a` files)
- Playlist `.json` file upload/import UI
- Skip buttons, volume control, white noise, speed toggle (yt-controls features not requested)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All genres and albums from the Dropbox-hosted `playlists.json` are visible in
  the sidebar within 2s of page load on a standard connection.
- **SC-002**: Clicking an album starts the YouTube video within 2s (network-permitting).
- **SC-003**: Changing the `playlists.json` in Dropbox and reloading the page reflects the
  change without any code deployment.
- **SC-004**: Setting `DROPBOX_PLAYLISTS_URL` in Vercel env is the only configuration step
  needed to wire up a new playlist source.

## Assumptions

- `playlists.json` follows the bach-player schema: `{ [genre]: Album[] }` where each `Album`
  has `name`, `youtubeId`, and optional `tracks: Track[]`.
- The Dropbox share link uses `?dl=1` (direct download) or is equivalent — server-side fetch
  with redirect-following resolves it to raw JSON.
- The user will access the page in a modern browser (Chrome/Firefox/Safari).
- YouTube's standard `<iframe>` embed works on the Vercel domain; no YouTube Data API key needed.
- The page does not persist the last-played album between sessions (no localStorage in v1).
