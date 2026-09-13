# Contract: Inline Card Lyric Editing with Sequential Navigation

This is a UI interaction contract (this feature has no network/API surface). It fixes the exact
behavior implementation and quickstart validation must agree on.

## 1. Opening the inline edit spot

- **Trigger**: a click (or `Enter`/`Space` while a card has keyboard focus, via its `tabIndex=0`)
  on a `.note-card` element that is not currently itself in edit mode.
- **Effect**:
  - If a different card is currently in edit mode, that card commits first (see §2), exactly as
    if it had lost focus.
  - The clicked/activated card shows a text input pre-filled with its current `cardLyrics[i]`
    value (empty string if none), focused, with its text selected.
- **Idempotence**: activating the same card again while it is already in edit mode does not reset
  or re-select the input's current (possibly already-edited) text.

## 2. Committing the inline edit spot

- **Triggers** (any one of):
  - `Enter` keydown while the input has focus.
  - The input loses focus (`blur`) for any reason (click elsewhere, Tab, clicking another card).
  - `,` or `.` keydown (see §4) — commits as a side effect of navigating.
- **Effect**: `cardLyrics[i] = value.trim()`. The edit spot closes and the card re-renders showing
  the new value (or no lyric line, if the trimmed value is empty).
- **Non-effect**: no other index of `cardLyrics` changes.

## 3. Canceling the inline edit spot

- **Trigger**: `Escape` keydown while the input has focus.
- **Effect**: the edit spot closes without writing — `cardLyrics[i]` remains exactly what it was
  before the card was activated, even if the user had typed something into the now-discarded
  input.

## 4. Sequential navigation (`,` / `.`)

- **Trigger**: `,` or `.` keydown while the edit spot's input has focus.
- **Effect** (`,`, "next")`:
  1. `e.preventDefault()` — the character is never inserted into the input.
  2. Commit the current card (§2, same as `Enter`).
  3. If `idx + 1` is a valid card index, open that card's edit spot (§1) — pre-filled with its
     current lyric, focused, selected.
  4. If there is no next card (this was the last one), the edit spot simply stays closed after
     the commit — no error, no wraparound.
- **Effect** (`.`, "previous")`: identical to the above, but commits and moves to `idx - 1`, and
  closes with no wraparound if `idx` was already `0`.
- **Non-effect**: neither key changes any card's lyric other than the one being left (via commit).

## 5. Interaction with existing render triggers

- `melodyOut`'s `input` event → `renderNoteStrip()` runs → `cardLyrics` length is reconciled to
  the new note count (pad end with `''` / truncate end), no existing lyric values are altered.
- Pressing Play → `renderNoteStrip()` runs once before playback starts, same as today; no lyric
  values change as a side effect of playback.
- The page's global keydown handler (for `002-relative-note-entry`'s staff/spot keybindings)
  already ignores all keys while a text `<input>` has focus, so none of §1–§4 above ever reaches
  or is affected by that handler, and vice versa.

## 6. "Export combined" data source

- `exportBtn`'s handler reads each note's lyric as `cardLyrics[i]`. `melodyOut.value` remains the
  note/duration source, unchanged.

## Round-trip guarantee

For any sequence of per-card edits and `,`/`.` navigation, at the moment "Export combined" is
run, it reflects `cardLyrics[i]` for every note `i` exactly as last committed.
