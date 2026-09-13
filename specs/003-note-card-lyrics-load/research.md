# Research: Inline Card Lyrics with Sequential Navigation

## Context gathered from `public/note_builder.html` (original behavior, before this feature)

- **Melody state** lives entirely in the `#melodyOut` textarea's text (`note:duration, note:duration, ...`).
  There is no separate JS array for the melody — `parseMelody()` re-splits `melodyOut.value` on
  every call.
- **Lyrics state** originally was entirely derived from a `#lyricsInput` text field
  (`parseLyrics()` split it on `,`), positionally matched to notes by index inside
  `renderNoteStrip()`. There was no independent per-card lyric store, and no way to set a lyric on
  one specific card without retyping the whole comma list and counting positions.
- **`renderNoteStrip()`** fully rebuilds every `.note-card`'s `innerHTML` from scratch each time
  it runs, from `parseMelody()` (+ lyric state). It runs from exactly two places: the `melodyOut`
  `input` listener, and once at the top of the Play button handler. Buttons that mutate
  `melodyOut.value` directly (`addNote`, `addRestBtn`, `undoBtn`, `clearBtn`, staff clicks,
  relative-step keys) set `.value` in JS, which does **not** fire a DOM `input` event, so the
  strip does not necessarily redraw at the moment those actions happen — it catches up next time
  the user types in `melodyOut` or presses Play. This is a pre-existing characteristic of the
  file, out of scope to change here.
- **`.note-card`** markup is `<span class="nc-name">`, `<span class="nc-dur">`, and optionally
  `<span class="nc-lyric">` (only rendered when a lyric exists for that index).
- **The global `keydown` handler** (for the `002-relative-note-entry` staff/spot keybindings)
  already guards `if(e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;` —
  so any key pressed while a text `<input>` has focus (including this feature's per-card edit
  box) never reaches that handler. This means `,`/`.` can be freely repurposed as navigation keys
  inside the per-card edit box without colliding with the existing duration-cycling `,`/`.` keys
  used elsewhere in the file (those only fire when focus is *not* inside a text field).

## Decision 1: Introduce a small persistent `cardLyrics` array as the lyric source of truth

**Decision**: Add one module-level array, `let cardLyrics = []`, index-aligned with the parsed
melody notes. `renderNoteStrip()` reads from `cardLyrics` when drawing each card's lyric, and
reconciles `cardLyrics`'s length to the current note count on every call (pad with `''` at the
end for newly-added notes, truncate at the end for removed notes), preserving existing entries by
index.

**Rationale**: FR-006 requires a lyric set by clicking a card to survive later melody edits
(add/undo/clear). A small in-memory array is the minimal state needed — consistent with
Constitution IV (no new abstractions/libraries, just one array and the existing imperative render
function extended in place).

## Decision 2: "Export combined" reads from `cardLyrics`

**Decision**: `exportBtn`'s click handler reads each note's lyric as `cardLyrics[i]` rather than
from any external field.

**Rationale**: `cardLyrics` (Decision 1) is the single, authoritative store of what's actually on
each card — reading from it directly is simply correct, and is the only sensible choice once
there is no separate lyrics field at all (round 5 removed the last alternative source).

## Decision 3: Inline edit spot implementation

**Decision**: On click (or `Enter`/`Space` keyboard activation) of a `.note-card` (event delegated
from the `#noteStrip` container, since cards are rebuilt on every render), if that card isn't
already in edit mode, render a small `<input type="text">` in place of/alongside its `.nc-lyric`
content, pre-filled with `cardLyrics[i]` and auto-focused with its text selected. `keydown` on
that input handles `Enter` (commit: write trimmed value into `cardLyrics[i]`, exit edit mode,
re-render) and `Escape` (exit edit mode without writing, re-render). A `blur` listener on the
input also commits, so clicking away or tabbing off saves. Only one card is ever in edit mode at
a time — opening a new one commits/exits any other first, by looking the target card up fresh by
id (`document.getElementById('nc-'+idx)`) rather than trusting a DOM element reference captured
before that commit's `renderNoteStrip()` call, which would otherwise be stale/detached (a real
bug caught during implementation: switching cards mid-edit re-renders the whole strip, so any
element reference taken before that render no longer exists in the document).

**Rationale**: Matches the file's existing patterns (direct DOM manipulation, no component
framework, `keydown`-driven interaction like the staff/relative-step keys already use). Event
delegation on the container (rather than one listener per card) is simplest given cards are torn
down and rebuilt on every render. `tabIndex = 0` on each card plus the same delegated `keydown`
listener handling `Enter`/`Space` gives keyboard-only users the same entry point as a click
(Constitution III).

**Alternatives considered**:
- *`contenteditable` span instead of an injected `<input>`* — rejected: harder to reliably
  select-all-on-focus and to distinguish Escape/Enter/blur consistently across browsers for a
  single-line value; a real `<input>` gets this for free.

## Decision 4 (round 5): `,`/`.` sequential navigation, and removing `lyricsInput` entirely

**Decision**: Once Decisions 1–3 exist, the user confirmed no separate lyrics field, "Apply to
cards" button, or "Sync to input" button is needed at all — round 4's implementation of all three
is deleted (`#lyricsInput`, `#applyLyricsBtn`, `#syncToInputBtn`, their handlers, and the
now-unused `parseLyrics()` function). In their place, the per-card edit box's `keydown` handler
(Decision 3) gains two more branches:
- `,` → `e.preventDefault()`; commit the current card exactly as `Enter` does
  (`closeCardEdit(true)`); then, if `idx + 1 < parseMelody().length`, call `openCardEdit(idx + 1)`.
- `.` → `e.preventDefault()`; commit the current card the same way; then, if `idx - 1 >= 0`, call
  `openCardEdit(idx - 1)`.

Both branches reuse `closeCardEdit`/`openCardEdit` unchanged (Decision 3) rather than introducing
a separate "move" code path — `openCardEdit`'s own re-render-then-look-up-fresh behavior already
makes this safe to call immediately after a commit.

**Rationale**: This is exactly what the user asked for once they clarified the model: "I can
input directly in the cards, I don't need lyricsInput at all." Reusing the existing commit/open
functions (rather than writing bespoke navigation logic) keeps the one bug class this feature is
prone to (stale DOM references across a re-render, per Decision 3) fixed in exactly one place.
Since lyrics already cannot contain `,` (reserved by "Export combined"'s format) or now `.`
(reserved here), no existing constraint is broken by repurposing these two keys — and the global
`002-relative-note-entry` keydown handler already ignores keys typed while a text `<input>` has
focus, so there is no conflict with that feature's own use of `,`/`.` for duration cycling
elsewhere on the page.

**Alternatives considered**:
- *Keep `lyricsInput` as a "current word" staging box, driven by a separate pointer/spot concept*
  (the user's own first phrasing of this idea) — superseded by the user's own follow-up
  correction: since per-card editing already exists, a second staging field would just be
  redundant indirection for the same result.
- *Arrow keys (`←`/`→`) instead of `,`/`.`* — not requested; `,`/`.` was the user's explicit
  choice, and conveniently these keys already read naturally as "next" and "back" given they're
  visually adjacent on a QWERTY keyboard.

## Summary

No new dependencies, no build step, no new files beyond this feature's `specs/` artifacts and the
edits to `public/note_builder.html` itself. Round 5 net effect versus round 4: strictly fewer
moving parts — one field and two buttons removed, two `keydown` branches added to code that
already existed. All unknowns resolved; no `NEEDS CLARIFICATION` markers remain.
