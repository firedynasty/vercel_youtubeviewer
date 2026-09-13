# Implementation Plan: Inline Card Lyrics with Sequential Navigation

**Branch**: `003-note-card-lyrics-load` | **Date**: 2026-09-13 (revised, round 5) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-note-card-lyrics-load/spec.md`

## Summary

`public/note_builder.html`'s note strip originally derived every card's lyric fresh, on every
render, purely from positional matching against a single `lyricsInput` comma-list field — so
attaching a lyric to one specific card meant retyping the whole list and counting positions. This
feature replaces that with two pieces, both backed by a small in-memory `cardLyrics` array
(index-aligned with the melody) that is now the sole source of truth for lyrics — read by the
rendered cards and by "Export combined":

1. **Inline per-card lyric editing**: clicking (or keyboard-activating) a note-card opens a small
   text entry directly on it; Enter/blur saves, Escape cancels, empty saves as "no lyric"; edits
   survive later melody changes.
2. **Sequential `,`/`.` navigation**: while that edit spot is open, `,` commits the current card
   and opens the next card's edit spot; `.` commits and opens the previous one — letting a user
   click once and then type an entire song's lyrics in order without touching the mouse again.

Round 4 built this instead as a pair of explicit buttons ("Apply to cards" / "Sync to input")
shuttling text to/from a separate `lyricsInput` field. Once per-card editing existed, the user
confirmed that field and both buttons were unnecessary indirection — round 5 removes `#lyricsInput`,
`#applyLyricsBtn`, `#syncToInputBtn`, and the now-unused `parseLyrics()` function entirely, in
favor of the `,`/`.` keys on the edit spot that already existed. No import/rebuild-from-a-combined-
string capability is in scope (dropped after round-1 spec feedback). Client-side-only change to
one static HTML file — no new dependencies, no build step, no server/API surface.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES6+, browser-native), inline in HTML — no transpilation/build step, matching the file's existing style.

**Primary Dependencies**: None added. Uses only existing browser APIs already in use in the file (DOM, `addEventListener`).

**Storage**: N/A beyond in-page JS state — one module-level array (`cardLyrics: string[]`), index-aligned with the parsed melody; no persistence across page loads, matching how `melodyOut` already works.

**Testing**: Manual browser verification via the scenarios in `quickstart.md` (no automated test harness exists for `public/*.html` galleries in this repo, per the same note in `002-relative-note-entry`'s plan). During implementation, behavior was additionally verified end-to-end with a throwaway jsdom harness (loads the real file and executes it) — not part of the shipped app or repo.

**Target Platform**: Desktop web browsers (matches the file's current mouse-and-keyboard design).

**Project Type**: Single static HTML page, edited in place. No new files, routes, or projects.

**Performance Goals**: Click-to-edit-open, edit-to-save, and `,`/`.` navigation feedback stays perceptually instant (<16ms) — same as today's direct DOM updates; no network calls are introduced.

**Constraints**: No lyrics field or bulk-entry control exists other than the note-cards themselves (FR-011). `,` and `.` are reserved navigation keys while the edit spot is open and must never be inserted as literal characters (FR-010). "Export combined" MUST read lyrics from `cardLyrics` (FR-007). Must not introduce a build step or dependency (Constitution IV). Must remain a self-contained static file deployable to Vercel with zero config (Constitution V). Must not modify the already-shipped `002-relative-note-entry` feature's keybindings/spot logic in the same file — and per research.md, the two features don't collide because the global keydown handler already ignores keys typed into any text `<input>`.

**Scale/Scope**: One file (`public/note_builder.html`, ~940 lines). Round-5 changes versus round 4: delete `#lyricsInput`, `#applyLyricsBtn`, `#syncToInputBtn` markup and their handlers; delete `parseLyrics()`; add two `keydown` branches (`,`/`.`) to the existing per-card edit input's handler, reusing `openCardEdit`/`closeCardEdit` unchanged. No new files except this feature's `specs/` artifacts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Content-Pipeline Authority | No text/video/image content is added; nothing bypasses `process_*.py`. | ✅ N/A — pure interaction-logic change |
| II. Modular, Self-Contained Sections | Change is entirely within `note_builder.html`; no other section's runtime state is touched or depended on. | ✅ Pass |
| III. Accessibility by Default | The inline edit spot is a real `<input>` reachable/operable via click + keyboard (`Tab`, `Enter`/`Space` to open, `Enter`/`Escape`/`,`/`.` while editing). Removing the two buttons and the field reduces the control surface rather than adding a mouse-only one. | ✅ Pass |
| IV. No Over-Engineering (YAGNI) | Round 5 is a net *removal* of code (a field, two buttons, one function) in favor of two `keydown` branches reusing existing functions; no new library, framework, or build tooling. | ✅ Pass |
| V. Vercel-Native Deployment | Still a static file under `public/`; no env vars, no server code. | ✅ Pass |

No violations. Complexity Tracking is not needed.

*Post-Phase-1 re-check: `research.md`, `data-model.md`, `contracts/card-lyric-editing.md`, and
`quickstart.md` describe removing state/controls (round 4's `lyricsInput`-related pieces) and
adding two keydown branches to already-keyboard-operable code — the table above still holds
unchanged, if anything more clearly than round 4.*

## Project Structure

### Documentation (this feature)

```text
specs/003-note-card-lyrics-load/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — card-lyric-editing.md
└── tasks.md             # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
public/
└── note_builder.html    # Single file modified: `cardLyrics` array, renderNoteStrip()
                          # reads/reconciles it, delegated click+keydown handlers on #noteStrip
                          # open the inline edit spot, its own keydown handles Enter/Escape/,/. ,
                          # exportBtn reads cardLyrics, "Clear all" resets cardLyrics. No separate
                          # lyrics field or buttons exist (removed in round 5).
```

**Structure Decision**: No new source files or directories. This is an in-place edit of the
single existing static HTML page `public/note_builder.html`, consistent with Constitution II
(self-contained sections) and IV (no new build surface). All feature-specific documentation lives
under `specs/003-note-card-lyrics-load/` per the standard spec-kit layout.

## Complexity Tracking

*No Constitution Check violations — this section is intentionally empty.*
