---
description: "Task list for Click-Anchored Relative Note Entry (Fixed-Spot Model)"
---

# Tasks: Click-Anchored Relative Note Entry (Fixed-Spot Model)

**Input**: Design documents from `/specs/002-relative-note-entry/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/keybindings.md, quickstart.md

**Tests**: Not requested — this feature is validated manually in a browser via `quickstart.md` (no automated test harness exists for `public/*.html` in this repo).

**Organization**: Tasks are grouped by user story. All code tasks edit the single file `public/note_builder.html`, so they are sequential — `[P]` is intentionally unused (same-file edits conflict). Stories remain independent, separately validatable increments.

**Round-2 context**: Round 1 already shipped in this file: duration remap (`,`/`.`/`/`/`q`), beat-value duration hints, `+`/`-` direction keys, and digit/backtick relative-step keys resolving from a **textarea-derived anchor**. This task list converts that derived anchor into a **fixed Spot** (defaults to C4, moved only by staff clicks and letter keys) and adds the visualized controls. Do NOT rebuild round-1 behavior.

## Phase 1: Setup

**Purpose**: Baseline capture before editing

- [ ] T001 Open `public/note_builder.html` in a browser and record baseline behavior for later regression comparison: letter keys C–B at current octave, Shift+letter sharps, `[`/`]` octave display, duration cycling via `Tab`/`Shift+Tab`/`,`/`.`, `/` and `q` reset to Quarter, `Z` undo, staff-row click adds a note, `+`/`-` set direction, digits `0`–`6`/backtick step from the last melody note (round-1 chained behavior — the behavior round 2 replaces)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Explicit Spot state + always-on visibility that every user story depends on (FR-002, FR-014)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T002 In `public/note_builder.html`, introduce explicit Spot state: add `let spot = 'C4';` immediately below `let direction = '+';` (~line 378); delete the entire `getAnchorRow()` function (~lines 395–404); add a `setSpot(name)` helper that strips any `#` from `name`, assigns it to `spot`, updates `document.getElementById('spotDisplay').textContent` (null-guarded so it also works before the readout markup exists), and calls `drawStaff()`. Per data-model.md: spot is always one of `rows[].name`, "natural rows only… sharp letter entry (e.g. `C#4`) sets the spot to the sharp's **natural row** (`C4`) — the `#` is stripped at `setSpot` time"
- [x] T003 In `public/note_builder.html`, add the Spot readout markup: inside the left `.panel`, immediately after the `<svg id="staff" viewBox="-30 0 530 330" ...></svg>` line and before the `<div class="btn-row">` containing `#addRestBtn`, insert a container div (matching the file's existing inline-style conventions, e.g. `display:flex;align-items:center;gap:8px;margin-top:10px;font-size:14px;`) containing the literal text `Spot: ` followed by `<b id="spotDisplay">C4</b>` — the initial text content MUST be `C4` to match the FR-002 default
- [x] T004 In `public/note_builder.html`, make `drawStaff()` render the spot marker: inside the existing `rows.forEach(r=>{...})` loop, when `r.name === spot`, append an accent-colored notehead ellipse to the SVG — `el('ellipse', {cx: X_NOTE, cy: r.y, rx: 9, ry: 6.5, fill: '#7c3aed'})` per research.md §8. The marker must move only when `setSpot` triggers a redraw (drawStaff is already a cheap full `innerHTML` rebuild, also re-run by `updateOctaveDisplay`)

**Checkpoint**: Page loads with no console errors; "Spot: C4" is visible under the staff and the C4 row carries the purple marker; `[`/`]` octave changes still redraw the staff correctly

---

## Phase 3: User Story 1 - Spot defaults to C4; digits always work off it without moving it (Priority: P1) 🎯 MVP

**Goal**: Digit keys `0`–`6` and backtick add notes measured from the fixed Spot; the Spot moves only on staff click during this story (letter-key wiring is US3)

**Independent Test**: quickstart.md scenarios 1–2 — fresh page shows Spot C4; pressing `1` three times appends three identical `D4` notes with the Spot unchanged; clicking the G4 row appends `G4` and moves the Spot readout/marker to G4, after which pressing `2` appends `B4`

### Implementation for User Story 1

- [x] T005 [US1] In `public/note_builder.html`, add a shared `relativeStep(magnitude)` helper immediately after `resolveStep`: its entire body is `addNote(resolveStep(spot, magnitude));` — critically it MUST NOT call `setSpot` (FR-007: the spot "MUST NOT change when a note is added via a relative-step key or step button"). Keep `resolveStep`'s existing clamping (`Math.max(0, Math.min(rows.length - 1, idx + delta))`) and sign convention (`direction === '+' ? -magnitude : magnitude`) unchanged
- [x] T006 [US1] In `public/note_builder.html`, rewire the digit/backtick branch of the `keydown` handler (~lines 473–480): delete the `const anchor = getAnchorRow();` line and the `if(anchor == null) return;` no-op guard (research.md §6 — the spot always exists, FR-002, so the guard is dead code), and replace the branch body with a single call to `relativeStep(...)`, passing `0` when the pressed key is the backtick alias and `Number(e.key)` otherwise; keep the `/^[0-6]$/.test(e.key) || e.key === '`'` condition and `e.preventDefault()` exactly as they are
- [x] T007 [US1] In `public/note_builder.html`, extend the staff-row click handler inside `drawStaff()` (currently `g.addEventListener('click', ()=>addNote(r.name));`, ~line 371) to also set the spot: `g.addEventListener('click', ()=>{ addNote(r.name); setSpot(r.name); });` — add the note first, then re-anchor (FR-001)
- [x] T008 [US1] In `public/note_builder.html`, extend the `#clearBtn` click handler (~lines 558–562) to call `setSpot('C4')` alongside its existing `direction = '+';` reset (FR-015: "Clear all" MUST clear the melody, reset the spot to C4, and reset direction to "+"; duration unaffected)
- [x] T009 [US1] In `public/note_builder.html`, update the `.sub` header paragraph (~line 216): replace the phrase "relative step from the last note" with fixed-spot wording — e.g. "0–6 = relative step from the Spot (staff-rows, in the current direction; 0 repeats it — backtick is an alias for 0). The Spot starts at C4 and moves only when you click the staff or press a letter key." Keep the rest of the keybinding summary (sharps, octaves, durations, undo) accurate and unchanged

**Checkpoint**: quickstart.md scenarios 1–2 pass; User Story 1 is fully functional on its own — this is the MVP (the round-2 correction the user asked for)

---

## Phase 4: User Story 2 - Visualized step buttons and a direction toggle (Priority: P2)

**Goal**: On-screen buttons 1/2/3 mirror digit keys exactly; a single −/+ toggle displays and flips direction; keyboard and on-screen state can never disagree

**Independent Test**: quickstart.md scenario 3 — with the Spot set, click the on-screen **2** button (appends a note 2 rows from the Spot; Spot unmoved); click the **−/+ toggle** (label flips to `−`; subsequent steps descend); press keyboard `+` (toggle label returns to `+`)

### Implementation for User Story 2

- [x] T010 [US2] In `public/note_builder.html`, add step-button markup inside the same container as `#spotDisplay` (from T003): `<button class="action step-btn" data-step="1">1</button>`, `<button class="action step-btn" data-step="2">2</button>`, `<button class="action step-btn" data-step="3">3</button>` — magnitudes 1–3 only, per contracts/keybindings.md Non-Goals ("magnitudes 0, 4, 5, 6 remain keyboard-only")
- [x] T011 [US2] In `public/note_builder.html`, wire the step buttons: attach one click listener per button via `document.querySelectorAll('.step-btn').forEach(...)` that calls `relativeStep(Number(btn.dataset.step))` — the SAME shared helper the digit keys use (research.md §7: "a single shared function per action is the only way parity is structural rather than remembered"); the handler MUST NOT call `setSpot` (FR-012: buttons behave "identically to the corresponding digit key")
- [x] T012 [US2] In `public/note_builder.html`, add the direction-toggle markup inside the same container: a single `<button class="action" id="dirToggle" title="Step direction">+</button>` whose text content always shows the current direction (initial `+`) — one control that displays state and flips it, not two separate buttons (research.md §7, FR-013)
- [x] T013 [US2] In `public/note_builder.html`, add a `setDirection(d)` helper that assigns `direction = d` and re-renders `#dirToggle`'s text content (null-guarded), then route all three mutation sites through it: (a) the `+`/`-` keydown branch (~lines 464–468) — `direction = e.key;` becomes `setDirection(e.key);`; (b) the `#clearBtn` reset — `direction = '+';` becomes `setDirection('+');`; (c) a new click listener on `#dirToggle` — `setDirection(direction === '+' ? '-' : '+');`. FR-013: the toggle's displayed state "MUST stay in sync with direction changes made via the `+`/`-` keys"

**Checkpoint**: quickstart.md scenario 3 passes; User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Absolute entry remains, and letter keys also move the spot (Priority: P3)

**Goal**: Letter-key entry (natural and sharp) is unchanged as an entry method AND re-anchors the Spot; octave/duration/undo/rest paths never touch it

**Independent Test**: quickstart.md scenario 4 — press `E` (appends `E4`, Spot becomes E4, then `1` appends `F4`); press `Shift+C` (appends `C#4`, Spot shows `C4`); `[`/`]` change only the octave display, never the Spot

### Implementation for User Story 3

- [x] T014 [US3] In `public/note_builder.html`, extend the letter-key branch of the `keydown` handler (~lines 484–495): after each `addNote(...)` call, call `setSpot(...)` with the added note's full name — natural path: `setSpot(e.key.toUpperCase() + currentOctave)`; sharp path: `setSpot(sharp + currentOctave)` (e.g. `C#4`) and let `setSpot`'s `#`-stripping normalize it to the natural row per FR-008 ("a sharp sets the spot to its natural staff row", `C#4` → `C4`). Both calls go AFTER `addNote` — add first, then re-anchor, matching the staff-click order in T007
- [x] T015 [US3] In `public/note_builder.html`, verify by inspection that no other code path mutates the Spot: the `[`/`]` octave branches, the `,`/`.`/`/`/`q` duration branches, the `Tab`/`Shift+Tab` branch, the `#undoBtn` handler, the `#addRestBtn` handler, and the `relativeStep`/`resolveStep` helpers MUST contain no `setSpot` call and no direct assignment to `spot` (FR-007, FR-010); then manually confirm quickstart.md scenario 5 — press `Z` twice and click "Add rest (_)": the Spot readout must not change

**Checkpoint**: quickstart.md scenarios 4–5 pass; all three stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Terminology hygiene and full end-to-end validation

- [x] T016 In `public/note_builder.html`, sweep stale round-1 terminology in code comments: the comment block above `resolveStep` (currently "Resolve a relative step of `magnitude` staff-rows from `anchorRow`…") and any other "anchor" wording in comments should say "spot" consistent with the fixed-spot model; also remove the now-dead "(FR-011-adjacent)" style references in deleted code paths — comments only, no behavior changes
- [ ] T017 Run the complete `quickstart.md` validation in a fresh browser tab — all 7 scenarios, including boundary clamping at D6/B3 (scenario 6) and the duration-remap regression checks (scenario 7) — with zero console errors; compare against the T001 baseline to confirm all pre-existing behaviors (letters, sharps, octaves, duration cycling/reset, undo, rest) are unchanged (SC-006)
- [x] T018 [US2] Round-3 refinement (user request): in `public/note_builder.html`, change the direction keydown branch from explicit-set (`+` → ascending, `-` → descending) to **toggle** on the physical `-` and `=` keys — `e.key` of `-`, `_`, `=`, or `+` all call `setDirection(direction === '+' ? '-' : '+')`, so no Shift is needed and the keys mirror the `#dirToggle` button exactly (FR-004, FR-013); `.sub` header text, contracts/keybindings.md, spec.md, and data-model.md updated to match
- [x] T019 Round-3 refinement (user request): in `public/note_builder.html`, add an `h`/`H` keydown branch mirroring the `q` branch — `document.querySelector('.dur-btn[data-dur="2"]').click()` jumps the sticky duration directly to Half (2 beats), "h" for Half (FR-018, FR-019 renumbered); `.sub` header text, contracts/keybindings.md, spec.md, data-model.md, and quickstart.md scenario 7 updated to match

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — baseline capture first
- **Foundational (Phase 2)**: Depends on T001 — BLOCKS all user stories (spot state + visibility are prerequisites for implementing or verifying any story)
- **User Stories (Phases 3–5)**: All depend on Foundational completion; execute in priority order P1 → P2 → P3
- **Polish (Phase 6)**: Depends on all completed stories

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational. Provides `relativeStep()` (T005), which US2's step buttons reuse (T011) — US2 therefore has a soft dependency on US1; do US1 first
- **US2 (P2)**: Reuses `relativeStep()` from US1 and the container markup from Foundational (T003); independently testable via quickstart scenario 3
- **US3 (P3)**: Independent of US2; touches only the letter-key branch; independently testable via quickstart scenario 4

### Parallel Opportunities

None — every code task edits the same single file (`public/note_builder.html`), so `[P]` is intentionally unused; execute tasks in ID order (T001 → T017). Stories are still independent validation checkpoints: stop after any checkpoint and validate with the referenced quickstart scenario before continuing.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001 baseline)
2. Complete Phase 2: Foundational (T002–T004 — spot state + visibility)
3. Complete Phase 3: User Story 1 (T005–T009)
4. **STOP and VALIDATE** with quickstart.md scenarios 1–2 — this alone delivers the round-2 correction: fixed Spot, C4 default, digits never move it

### Incremental Delivery

1. Foundational + US1 → validate → **MVP** (fixed-spot keyboard model complete)
2. Add US2 → validate scenario 3 → visualized controls complete
3. Add US3 → validate scenarios 4–5 → letter-keys-move-spot complete
4. Polish (T016–T017) → full 7-scenario quickstart pass, zero regressions

---

## Notes

- [Story] labels map to spec.md user stories (US1–US3); Setup/Foundational/Polish carry no label
- Round-1 duration behavior (`,`/`.` cycling, `/`/`q` Quarter reset, beat-value hints, `Tab`/`Shift+Tab`) is already shipped — do not rebuild; T017 regression-checks it
- Each checkpoint references the exact quickstart.md scenario that proves the story; there is no automated test runner for this file
- Line numbers in task descriptions are approximate anchors from the round-1 file (~849 lines); match on the quoted code, not the line number
