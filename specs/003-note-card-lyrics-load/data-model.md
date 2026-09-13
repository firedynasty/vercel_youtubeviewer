# Data Model: Inline Card Lyrics with Sequential Navigation

This feature has no server-side data and no persistence beyond the page's own in-memory state
(matching Constitution V — no backend). The "entities" below are in-page JavaScript state and
DOM structure, not database records.

## `cardLyrics: string[]`

The sole in-memory store of per-card lyrics.

| Field | Type | Notes |
|---|---|---|
| index `i` | implicit (array position) | Aligned 1:1 with `parseMelody()`'s note at the same index; `cardLyrics[i]` is the lyric for the `i`-th note-card, or `''` if it has none. |

**Validation rules**:
- Length is always reconciled to `parseMelody().length` inside `renderNoteStrip()` (padded with
  `''` when the melody grows, truncated from the end when it shrinks) — see research.md Decision 1.
- A value MUST NOT contain `,`, `.`, or `:` — `,`/`.` are reserved navigation keys while the edit
  spot is open (research.md Decision 4), and `:` is reserved by "Export combined"'s output format.

**State transitions**:
- **Per-card edit (commit via Enter, blur, or moving to another card)**: `cardLyrics[idx] = trimmedValue`.
  This is the *only* way a lyric value is ever set — there is no other input surface.
- **Sequential navigation (`,`/`.`)**: commits the current card exactly like the transition above,
  then opens the adjacent card's edit spot (no state change of its own beyond the commit).
- **Length reconciliation**: every `renderNoteStrip()` call → pad/truncate as described above, no
  existing values change.
- **Reset**: "Clear all" → `cardLyrics = []` (mirrors `melodyOut` being cleared).
- **Read-out (not a transition)**: "Export combined" *reads* `cardLyrics`; nothing else reads it.

## Note Card (rendered, not stored)

Purely a DOM representation computed each render from `parseMelody()[i]` + `cardLyrics[i]`; not a
separate stored entity. Carries: note name, duration label, optional lyric, `data-idx` (the index,
used by the delegated click/keydown listeners), `tabIndex = 0` (keyboard focusability), and an
edit-mode flag tracked only as "is this the one `.note-card` currently showing its inline
`<input>`" — at most one card is in edit mode at any time (`editingCard`, see research.md
Decision 3).

## Removed in round 5

`#lyricsInput`, `#applyLyricsBtn`, `#syncToInputBtn`, and the `parseLyrics()` function no longer
exist. There is no field or control other than the note-cards themselves through which a lyric
can be read or written.
