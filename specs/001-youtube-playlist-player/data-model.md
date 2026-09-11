# Data Model: YouTube Playlist Player

## Entities

### PlaylistMap (root JSON object)

Returned by `/api/playlists`. Keys are genre slugs; values are ordered arrays of Albums.

```
PlaylistMap = { [genreKey: string]: Album[] }
```

**Validation**: Object (not array). At least one key required for the sidebar to render.

---

### Genre (derived from PlaylistMap key)

| Field | Type | Notes |
|-------|------|-------|
| `key` | `string` | The raw JSON key (e.g., `"classical"`, `"deepwork_focus"`) |
| `label` | `string` | Display name — key with underscores replaced by spaces, title-cased |
| `albums` | `Album[]` | Ordered list; render in index order |

---

### Album

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | `string` | Required; used as sidebar label |
| `youtubeId` | `string` | Required; may be empty string — treat empty as "no video" |
| `tracks` | `Track[]` | Optional; if absent or empty array, no chapter list is shown |

**State**: Each album in the sidebar has one of: `idle`, `selected` (loaded in player).

---

### Track

| Field | Type | Constraints |
|-------|------|-------------|
| `title` | `string` | Required; display label in track list |
| `seconds` | `number` | Required; seek offset for iframe `?start=` param (integer) |
| `time` | `string` | Optional; human-readable timestamp label (e.g., `"1:39"`) — display only |

**State**: Each track has one of: `idle`, `active` (currently playing).

---

## Client-Side State (in-memory, not persisted)

| Variable | Type | Description |
|----------|------|-------------|
| `playlists` | `PlaylistMap` | Loaded once on page init from `/api/playlists` |
| `selectedAlbum` | `Album \| null` | Currently loaded album; drives iframe src and track list |
| `selectedTrack` | `Track \| null` | Currently active track (null if album has no tracks) |
| `cursorIndex` | `number` | Flat album index for keyboard navigation |

---

## API Response Shape

`GET /api/playlists` → `200 OK` with `Content-Type: application/json`

```json
{
  "classical": [
    {
      "name": "Bach - Classical Music for Brain Power",
      "youtubeId": "VmImA0YKsJg",
      "tracks": []
    }
  ],
  "adhd": [
    {
      "name": "brainwave",
      "youtubeId": "0l0mK7Pr6sQ",
      "tracks": [
        { "time": "0:00", "seconds": 0, "title": "Study Music using Binaural Beats" },
        { "time": "1:39", "seconds": 99, "title": "14Hz Beta Focus" }
      ]
    }
  ]
}
```

Error shape (4xx/5xx):

```json
{ "error": "Missing DROPBOX_PLAYLISTS_URL env var" }
```
