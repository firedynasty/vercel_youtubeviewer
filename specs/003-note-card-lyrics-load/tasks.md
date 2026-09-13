---
description: "Task list for Inline Card Lyrics with Sequential Navigation"
---

# Tasks: Inline Card Lyrics with Sequential Navigation

**Input**: Design documents from `/specs/003-note-card-lyrics-load/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/card-lyric-editing.md, quickstart.md

**Tests**: Not requested — this feature is validated manually in a browser via `quickstart.md` (no automated test harness exists for `public/*.html` in this repo, per `002-relative-note-entry`'s tasks.md). During implementation it was additionally verified with a throwaway jsdom harness (not part of the repo).

**Organization**: Tasks are grouped by user story. All code tasks edit the single file `public/note_builder.html`, so they are sequential — `[P]` is intentionally unused (same-file edits conflict). Stories remain independent, separately validatable increments.

**⚠️ Historical note (round 5 superseded Phases 4–5)**: T013–T016 below built "Apply to cards" and "Sync to input" as a pair of buttons around a separate `lyricsInput` field (round 4 of the spec). Once per-card editing (Phase 3) existed, the user confirmed that field and both buttons were unnecessary and asked for them to be removed in favor of `,`/`.` navigation on the per-card edit spot itself. **Phase 7 (T020–T024) is what actually ships** — it removes everything Phase 4–5 added and replaces it with two `keydown` branches. Phases 4–5 are kept below, marked done, as an accurate record of what was built and then deliberately superseded; do not use them to understand the current behavior of the file — read Phase 7 and the current spec.md/research.md instead.

**Context**: `cardLyrics`, a small persistent array, is the single source of truth for per-card lyrics — read by the rendered cards and by "Export combined". Lyrics are set exclusively by clicking (or keyboard-activating) a note-card to open an inline edit spot on it (US1); while that edit spot is open, `,`/`.` commit the current card and move editing to the next/previous card (US2, Phase 7) — there is no separate lyrics field or bulk-entry control.

## Phase 1: Setup

**Purpose**: Baseline capture before editing

- [X] T001 Open `public/note_builder.html` in a browser and record baseline behavior for later regression comparison: typing into `#lyricsInput` currently re-renders `#noteStrip` live via its `input` listener (~line 902), lyrics are matched to cards purely positionally from `parseLyrics()` (~line 818) inside `renderNoteStrip()` (~line 825), and `#exportBtn`'s handler (~line 699) independently re-splits both `#melodyOut` and `#lyricsInput` at export time. This is the behavior this feature replaces — confirm melody/duration/staff/keybinding behavior (everything from `002-relative-note-entry`) is unaffected throughout

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Introduce `cardLyrics` as the single source of truth for per-card lyrics that every user story, and "Export combined", read from and write to

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 In `public/note_builder.html`, add `let cardLyrics = [];` as a new module-level array, placed immediately after `const DUR_LABELS = {0.5:'♪',1:'♩',1.5:'♩.',2:'𝅗𝅥',3:'𝅗𝅥.',4:'○'};` (~line 824) and before `function renderNoteStrip(){` — per data-model.md, this is index-aligned with `parseMelody()`'s notes and is the authoritative store per note-card
- [X] T003 In `public/note_builder.html`, add a `reconcileCardLyrics(n)` helper next to `cardLyrics`'s declaration: pads `cardLyrics` with `''` entries until its length reaches `n`, then truncates any excess from the end (`cardLyrics.length = n`) — implements research.md Decision 1's "pad with `''` at the end for newly-added notes, truncate at the end for removed notes, preserving existing entries by index"
- [X] T004 In `public/note_builder.html`, modify `renderNoteStrip()` (~lines 825–843): delete the `const lyrics = parseLyrics();` line, call `reconcileCardLyrics(notes.length)` immediately after `const notes = parseMelody();`, and change the lyric-span line from reading `lyrics[i]` to reading `cardLyrics[i]` (`const lyricSpan = cardLyrics[i] ? \`<span class="nc-lyric">${cardLyrics[i]}</span>\` : '';`) — per data-model.md and research.md Decision 1, this makes `cardLyrics` (not a fresh `parseLyrics()` call) the render source, and guarantees FR-006 (a per-card lyric survives later melody-length changes, since only the pad/truncate step touches array length, never existing values)
- [X] T005 In `public/note_builder.html`, extend the `#clearBtn` click handler (~lines 614–619) with `cardLyrics = [];` alongside its existing `melodyOut`/`rhythmInput`/direction/spot resets — per data-model.md's "Reset" transition, so a cleared page doesn't retain stale per-card lyrics until the next render
- [X] T006 In `public/note_builder.html`, repoint the `#exportBtn` click handler (~lines 699–711): delete the `const lyrics = document.getElementById('lyricsInput').value.split(',').map(s=>s.trim());` line, and change the `combined` mapping's lyric lookup from `lyrics[i]` to `cardLyrics[i]` — implements FR-011/FR-012 and research.md Decision 5, so "Export combined" always reflects the cards' actual state regardless of what's currently in `lyricsInput` or whether Apply/Sync have ever been clicked
- [X] T007 In `public/note_builder.html`, delete the line `document.getElementById('lyricsInput').addEventListener('input', renderNoteStrip);` (~line 902) — implements FR-007: typing into `lyricsInput` must have no live effect on any card. Leave the `#melodyOut` `input` listener (~line 901) untouched

**Checkpoint**: Page loads with no console errors; typing into `lyricsInput` no longer changes `#noteStrip`; `cardLyrics` drives both the rendered cards and "Export combined" (both will simply show/export no lyrics yet, since nothing sets `cardLyrics` until US1/US2 land — expected at this checkpoint)

---

## Phase 3: User Story 1 - Edit a specific card's lyric directly on the card (Priority: P1) 🎯 MVP

**Goal**: Clicking (or keyboard-activating) any note-card opens an inline text entry for that exact card's lyric; Enter/blur saves, Escape cancels, saving empty clears it — independent of `lyricsInput` entirely

**Independent Test**: quickstart.md Scenarios 1–3 — click card index 2, type "hear", confirm; only that card changes; add cards 0/1 similarly; re-edit and clear a card; Escape discards an in-progress edit; adding/undoing a melody note afterward doesn't disturb existing per-card lyrics

### Implementation for User Story 1

- [X] T008 [US1] In `public/note_builder.html`, in `renderNoteStrip()`'s card-creation loop (~lines 836–841, the same `notes.forEach((n,i)=>{...})` from T004), add `card.dataset.idx = i;` and `card.tabIndex = 0;` right after `card.id='nc-'+i;` — `dataset.idx` lets the click/keydown handlers (T009) identify which card was activated, and `tabIndex = 0` makes each card keyboard-focusable so opening the edit spot doesn't require a mouse (Constitution III)
- [X] T009 [US1] In `public/note_builder.html`, add `let editingCard = null;` (module-level, next to `cardLyrics`) and two helper functions placed after `renderNoteStrip()`: `openCardEdit(card, idx)` — if `editingCard` is already set for a different card, first call `closeCardEdit(true)`; otherwise if it's the same card, do nothing (contracts/card-lyric-editing.md §1 idempotence); then build an `<input type="text">` prefilled with `cardLyrics[idx] || ''`, insert it into `card` (replacing/hiding the `.nc-lyric` content for that card), call `.focus()` and `.select()` on it, and set `editingCard = {idx, input}`. `closeCardEdit(commit)` — if `editingCard` is null, return; if `commit` is true, set `cardLyrics[editingCard.idx] = editingCard.input.value.trim()`; set `editingCard = null`; call `renderNoteStrip()` — per contracts/card-lyric-editing.md §2–3 and data-model.md's per-card-edit transition
- [X] T010 [US1] In `public/note_builder.html`, inside `openCardEdit`, attach to the created `<input>`: a `keydown` listener that calls `closeCardEdit(true)` on `Enter` and `closeCardEdit(false)` on `Escape` (calling `e.preventDefault()` in both cases so the keystroke doesn't propagate), and a `blur` listener that calls `closeCardEdit(true)` — per contracts/card-lyric-editing.md §2 ("Enter, or moving focus away") and §3
- [X] T011 [US1] In `public/note_builder.html`, near the other delegated listeners at the bottom of the script (~after line 902), add one `click` listener and one `keydown` listener on `document.getElementById('noteStrip')`: on `click`, find `e.target.closest('.note-card')`; if found, call `openCardEdit(card, Number(card.dataset.idx))` unless the click originated inside an already-open edit `<input>` (let the input's own handlers manage that). On `keydown`, do the same lookup but only act on `Enter` or `Space` on a card that is not itself the edit `<input>`, calling `e.preventDefault()` before opening — this is the keyboard-activation path for the `tabIndex` added in T008
- [X] T012 [US1] Manually verify quickstart.md Scenarios 1–3 in a browser: setting lyrics on specific, non-sequential cards; re-opening a card pre-fills its current value; Escape discards changes; saving an empty value clears the card's lyric (FR-005 — already implied by `cardLyrics[idx] = ''` rendering no `.nc-lyric` span); adding a new note or clicking "Undo last" afterward leaves existing per-card lyrics untouched (FR-006); "Export combined" reflects per-card lyrics regardless of `lyricsInput`'s content (FR-007 Scenario 7/8)

**Checkpoint**: quickstart.md Scenarios 1–3 pass; User Story 1 is fully functional and independently valuable — this is the MVP

---

## Phase 4 (SUPERSEDED by Phase 7 — kept for history, see note above): "Apply to cards"

**Goal**: An explicit "Apply to cards" button reads `lyricsInput`'s current text and applies it to the cards positionally, fully replacing whatever was there — restoring bulk entry without live-typing

**Independent Test**: quickstart.md Scenario 4 — type a 5-word comma list into `lyricsInput`, confirm no card changes yet, click "Apply to cards", confirm all 5 cards update at once; Scenario 5 — Apply always fully overwrites, including cards edited individually since the last Apply, and treats missing trailing entries as empty

### Implementation for User Story 2

- [X] T013 [US2] In `public/note_builder.html`, add the "Apply to cards" button markup in the Lyrics toolbar row (~lines 302–306), inserted between the `#lyricsInput` element and the `<label>BPM</label>` element: `<button class="action" id="applyLyricsBtn" title="Apply this text to the cards">Apply to cards</button>` — per FR-013a (placed in the Lyrics toolbar, before the BPM control)
- [X] T014 [US2] In `public/note_builder.html`, near the other button listeners (e.g. after the `#exportBtn` listener, ~line 711), add: `document.getElementById('applyLyricsBtn').addEventListener('click', ()=>{ cardLyrics = parseLyrics(); renderNoteStrip(); });` — `parseLyrics()` (unchanged, ~line 818) reuses `lyricsInput`'s existing comma-split parsing exactly, and `renderNoteStrip()`'s own `reconcileCardLyrics` call (from T004) pads/truncates the result to the current note count automatically — per research.md Decision 6 and FR-013/014/015

**Checkpoint**: quickstart.md Scenario 4–5 pass; User Stories 1 AND 2 both work independently — bulk entry is restored as an explicit action, per-card editing still works, typing alone still does nothing

---

## Phase 5 (SUPERSEDED by Phase 7 — kept for history, see note above): "Sync to input"

**Goal**: An explicit "Sync to input" button reads every card's current lyric, in order, and writes it into `lyricsInput` as a comma list with empty entries for cards without a lyric

**Independent Test**: quickstart.md Scenario 6 — set cards 0/1/2 to do/you/hear on an 8-card strip, click "Sync to input", confirm `lyricsInput` reads exactly `do,you,hear,,,,,`; Scenario 8 — syncing an empty note strip clears `lyricsInput` without error

### Implementation for User Story 3

- [X] T015 [US3] In `public/note_builder.html`, add the "Sync to input" button markup immediately after the "Apply to cards" button from T013 (still before the `<label>BPM</label>` element): `<button class="action" id="syncToInputBtn" title="Write the cards' current lyrics into this field">Sync to input</button>` — per FR-008a (placed alongside "Apply to cards", before BPM)
- [X] T016 [US3] In `public/note_builder.html`, near the `applyLyricsBtn` listener (T014), add: `document.getElementById('syncToInputBtn').addEventListener('click', ()=>{ document.getElementById('lyricsInput').value = cardLyrics.map(l => l || '').join(','); });` — per research.md Decision 4 and FR-008/009/010 (no space after commas, full replace, entry count always equals the current note-card count since `cardLyrics` is already reconciled by the last render)

**Checkpoint (historical, round 4)**: quickstart.md Scenarios 6 and 8 (round-4 numbering) passed; superseded — see Phase 7

---

## Phase 7 (round 5 — this is what actually ships): Sequential `,`/`.` navigation, and removing round 4

**Goal**: Remove the separate lyrics field and both buttons entirely; while the per-card edit spot (Phase 3) is open, `,` commits and moves to the next card, `.` commits and moves to the previous card

**Independent Test**: quickstart.md Scenarios 4–7 (current numbering) — click card 0, type "hello", press `,` (moves to card 1), type "good", press `,` (moves to card 2), type "work", press `,` (moves to card 3, empty) — matches the user's own worked example exactly; pressing `.` repeatedly walks back to card 0; `,` at the last card / `.` at the first card just commits and closes

### Implementation for User Story 2 (round 5)

- [X] T020 [US2] In `public/note_builder.html`, remove the round-4 markup from the Lyrics toolbar row: the `#lyricsInput` `<input>`, `#applyLyricsBtn`, and `#syncToInputBtn` buttons. Replace with a short static help label, e.g. `<span style="font-size:12px;color:var(--muted);">Click a card to type its lyric — "," / "." moves to the next/previous card</span>`
- [X] T021 [US2] In `public/note_builder.html`, delete the `parseLyrics()` function entirely — its only caller (`applyLyricsBtn`'s handler) no longer exists
- [X] T022 [US2] In `public/note_builder.html`, delete the `applyLyricsBtn` and `syncToInputBtn` click-listener registrations near the bottom of the script
- [X] T023 [US2] In `public/note_builder.html`, inside the per-card edit `<input>`'s `keydown` listener (added in T010), add two more branches: `,` → `e.preventDefault()`, call `closeCardEdit(true)`, then if `idx + 1 < parseMelody().length` call `openCardEdit(idx + 1)`; `.` → `e.preventDefault()`, call `closeCardEdit(true)`, then if `idx - 1 >= 0` call `openCardEdit(idx - 1)` — per contracts/card-lyric-editing.md §4, reusing `openCardEdit`/`closeCardEdit` unchanged (idx is already in scope as the closure parameter from T009)
- [X] T024 [US2] Manually verify quickstart.md Scenarios 4–7 (current numbering): sequential `,` entry across several cards with no mouse; `.` navigating back with correct pre-filled values; boundary behavior at the first/last card (commit-and-close, no wraparound); `,`/`.` never appear as literal characters in a saved lyric

**Checkpoint**: quickstart.md Scenarios 1–9 (current numbering) all pass; the Lyrics toolbar contains no field or button other than the existing BPM/Play/Stop controls (Scenario 9)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full regression pass and accessibility confirmation

- [X] T017 Manually run quickstart.md Scenario 8 (current numbering — Export combined reads the cards) and re-run Scenarios 1–7 and 9 together in one session (not just in isolation) — e.g. clicking a card, typing, `,`-navigating across several cards, `.`-ing back to fix one, then exporting — at every step "Export combined" and the visible cards must agree
- [X] T018 Manually confirm Constitution III (Accessibility by Default) end-to-end: note-card click-to-edit (via `Tab` + `Enter`/`Space`, per T008/T011) and `,`/`.` navigation (T023) are reachable and operable using only the keyboard; confirm no mouse-only control exists anywhere in the Lyrics panel (there are no buttons left to check — Scenario 9)
- [X] T019 Manually confirm no regression in `002-relative-note-entry`'s keybindings/spot behavior (staff clicks, letter keys, digit/backtick relative steps, step buttons, direction toggle) — this feature must not touch that code path, and per research.md, `,`/`.` typed into the per-card edit input never reaches that feature's global keydown handler (which already ignores keys while a text `<input>` has focus)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories (introduces `cardLyrics`, which every story reads or writes)
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **Phases 4–5**: Historical, superseded — see the note near the top of this file. Do not build from them.
- **User Story 2 / Phase 7**: Depends on Phase 3 (reuses its `openCardEdit`/`closeCardEdit` and the edit input's `keydown` handler)
- **Polish (Phase 6)**: Depends on Phase 3 and Phase 7 being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. Independently testable via quickstart Scenarios 1–3
- **US2 (P2, Phase 7)**: Starts after US1 (Phase 3) exists — `,`/`.` navigation is implemented as two extra branches on US1's own edit-input `keydown` handler, not a separate mechanism. Independently testable via quickstart Scenarios 4–7

### Parallel Opportunities

None — every code task edits the single file `public/note_builder.html`, so `[P]` is intentionally unused; execute tasks in ID order (T001 → T012, then T020 → T024, then T017 → T019 — skip the historical T013–T016 entirely). Stories remain independent validation checkpoints: stop after any checkpoint and validate with the referenced quickstart scenario(s) before continuing.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 baseline)
2. Complete Phase 2: Foundational (T002–T007 — `cardLyrics` + reconciliation + Export repointing)
3. Complete Phase 3: User Story 1 (T008–T012)
4. **STOP and VALIDATE** with quickstart.md Scenarios 1–3 — this alone delivers per-card lyric editing, the feature's core reported problem

### Incremental Delivery (as actually shipped)

1. Foundational + US1 → validate → **MVP** (click-to-edit per-card lyrics complete)
2. ~~Add "Apply to cards" / "Sync to input" (Phases 4–5)~~ → built, then removed per user follow-up (see historical note)
3. Add US2 / Phase 7 (`,`/`.` navigation) → validate Scenarios 4–7 → sequential entry complete, replaces Phases 4–5
4. Polish (T017–T019) → full 9-scenario quickstart pass, zero regressions in `002-relative-note-entry`

---

## Notes

- [Story] labels map to spec.md user stories (US1, US2); Setup/Foundational/Polish carry no label
- Every task edits the same single file (`public/note_builder.html`); `[P]` is unused throughout
- `parseLyrics()` no longer exists (removed in T021) — round 4 (T014) was its only caller and is also removed (T022)
- Each checkpoint references the exact quickstart.md scenario(s) that prove the story; there is no automated test runner for this file
- Line numbers in task descriptions are approximate anchors from the file as it stood at each round; match on the quoted code, not the line number
