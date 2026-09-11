# Quickstart Validation Guide: YouTube Playlist Player

## Prerequisites

- Node.js 24 + npm installed
- Vercel CLI installed (`npm i -g vercel@latest`)
- A Dropbox account with `playlists.json` shared publicly (direct-download link)
- The `vercel_youtube` repo linked to a Vercel project (`vercel link`)

---

## Setup

### 1. Generate playlists.json from the bach-player text files

From the `vercel_youtube` repo root:
```bash
python generate_playlists.py \
  -i /Users/stanleytan/Documents/technical/github/extensions/bach-player/playlists \
  -o playlists.json
```

This reads all `.txt` files in the bach-player `playlists/` directory and writes
`playlists.json` in the repo root. You should see output like:
```
  classical/Bach - Classical Music for Brain Power [VmImA0YKsJg].txt: 1 entry(ies), 28 tracks
  adhd/brainwave.txt: 1 entry(ies), 12 tracks
  ...
-> Wrote 8 categories, 54 entries to playlists.json
```

### 2. Upload playlists.json to Dropbox

Copy the generated `playlists.json` to your Dropbox folder. Then share it publicly:
- In Dropbox: right-click → Share → Copy link
- Change `?dl=0` at the end to `?dl=1` to get a direct-download link

Example: `https://www.dropbox.com/s/XXXXXXXXXXXX/playlists.json?dl=1`

### 3. Set the environment variable

**Local dev** (`.env.local`):
```
DROPBOX_PLAYLISTS_URL=https://www.dropbox.com/s/XXXXXXXXXXXX/playlists.json?dl=1
```

**Vercel production**:
```bash
vercel env add YOUTUBE_PLAYLISTS_URL production
```

### 4. Start local dev server

```bash
vercel dev
# Runs on http://localhost:3000
```

---

## Validation Scenarios

### S-1: API proxy returns playlist data

```bash
curl http://localhost:3000/api/playlists | python3 -m json.tool | head -30
```

**Expected**: JSON object with genre keys (`classical`, `adhd`, etc.) each containing an
array of album objects. No `"error"` key in the response.

---

### S-2: Sidebar renders all genres and albums

1. Open `http://localhost:3000/youtube-playlist-player.html` in Chrome.
2. Verify the left sidebar shows multiple collapsible genre sections.
3. Expand a genre — album names are listed and clickable.

**Expected**: All genres from `playlists.json` appear. No "Error loading playlists" message.

---

### S-3: Clicking an album loads the YouTube video

1. Click any album in the sidebar.
2. Observe the right panel.

**Expected**:
- The YouTube iframe updates its `src` to `https://www.youtube.com/embed/{youtubeId}?autoplay=1`.
- The video begins loading/playing.
- The clicked album item is highlighted (distinct background/color).

---

### S-4: Track list appears for albums with chapters

1. Expand the **adhd** genre.
2. Click **brainwave** album.

**Expected**:
- A track list appears below the iframe listing ~12 chapter titles.
- Clicking a track (e.g., "14Hz Beta Focus") reloads the iframe with `?start=99&autoplay=1`.

---

### S-5: Albums with no chapters show no track list

1. Click any album with an empty `tracks` array (e.g., most `classical` genre entries).

**Expected**: No track list section is shown below the player.

---

### S-6: Keyboard navigation

1. Click anywhere on the page to ensure focus.
2. Press `↓` repeatedly.

**Expected**: Sidebar highlight moves down through albums (crossing genre boundaries).
Press `Enter` — the highlighted album's video loads in the iframe.

---

### S-7: Error handling — missing env var

1. Temporarily rename `.env.local` to `.env.local.bak`.
2. Restart `vercel dev`.
3. Open the page.

**Expected**: An error message is visible in the player area (e.g., "Failed to load
playlists"). The sidebar is empty. No unhandled JS exception in the console.

---

## Production Verification

After deploying (`vercel --prod`):

```bash
curl https://your-project.vercel.app/api/playlists | python3 -m json.tool | head -5
```

Then open `https://your-project.vercel.app/youtube-playlist-player.html` and repeat S-2
through S-4 above.
