# Feature Specification: Click-Anchored Relative Note Entry (Fixed-Spot Model)

**Feature Branch**: `002-relative-note-entry`

**Created**: 2026-09-12

**Status**: Draft (revised 2026-09-12 — round 2: fixed-spot model replaces walking-anchor model)

**Input (round 1)**: "More efficient keyboard-driven note entry for the staff editor in public/note_builder.html… click on a position on the staff to set a reference point, then use relative keycodes to add notes near it… '-' for stepping down/backward and '+' for stepping up/forward… keep existing entry method working."

**Input (round 2 — current)**: "I'm not getting the expected results because I need a spot where it starts at C4 when the page first loads and then when I click on the #staff then it will change the key to that and the keycodes go off of that… the best way is to add a visualizing buttons 1,2,3 and then -/+ toggle and the '-' '+' will toggle so the note that is added will depend on the spot, and by the way the spot never changes by keycode or these new visualized buttons though — only clicking on the staff changes it, and then later if I got C,d,e,f,g,a,b will change too the spot."

**Round-2 delta (why this revision exists)**: The round-1 implementation derived the
reference point ("anchor") from the last note in the melody, so (a) no reference existed on a
fresh page — digit keys were no-ops — and (b) every added note became the new reference, so
pressing `1` repeatedly walked up the staff. The user wants a **fixed spot** instead: it starts
at C4, moves **only** when the staff is clicked (or a letter key is pressed), and digit
keys/buttons always compute from that fixed spot without moving it. On-screen buttons
(1, 2, 3) and a direction toggle make the model visible and mouse-accessible.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Spot defaults to C4; digits always work off it without moving it (Priority: P1)

A user opens the page. A visible "spot" readout shows **C4** — no click needed first. The user
presses `1`: a D4 (one staff position above the spot, default direction "+") is added, and the
spot **stays on C4**. Pressing `1` again adds another D4 — the spot never advances. The user
then clicks the G4 row on the staff: G4 is added (as today) and the spot moves to G4. Now `2`
adds B4, `3` adds C5 — always measured from G4 until the next staff click.

**Why this priority**: This is the exact model the user described and the correction to the
round-1 behavior they're not getting: an always-present, visible reference point that only the
staff (and letter keys) can move. Everything else hangs off it.

**Independent Test**: Fresh page load — verify the spot display reads C4, press `1` twice —
verify two `D4` notes are appended and the spot display still reads C4. Click the G4 row —
verify `G4` is appended and the spot display now reads G4.

**Acceptance Scenarios**:

1. **Given** a freshly loaded page, **When** the user has not clicked or pressed anything,
   **Then** the current spot is C4 and is visibly indicated as such.
2. **Given** the spot is C4 and direction is at its default ("+"), **When** the user presses
   `1`, **Then** D4 is added to the melody **and** the spot remains C4.
3. **Given** the spot is C4, **When** the user presses `1` three times in a row, **Then** three
   identical D4 notes are added (each press is measured from the unchanged spot, not from the
   previous note).
4. **Given** any melody state, **When** the user clicks the G4 row on the staff, **Then** G4 is
   added to the melody exactly as it is today, **and** the spot becomes G4.
5. **Given** the spot is G4, **When** the user presses `3`, **Then** a note three staff
   positions above G4 (C5) is added, and the spot remains G4.

---

### User Story 2 - Visualized step buttons and a direction toggle (Priority: P2)

A user who prefers the mouse — or who wants to see the model while learning the keys — gets
on-screen controls that mirror the keyboard: three step buttons labeled **1**, **2**, **3**, and
a single **−/+ toggle** that displays the current direction and flips it when clicked. The
current spot is shown as text and marked on the staff itself, so "what will the next digit do"
is always answerable at a glance.

**Why this priority**: The user explicitly asked for these visualized controls ("the best way
is to add a visualizing buttons 1,2,3 and then -/+ toggle"). They make the fixed-spot model
discoverable and fully operable without memorizing keybindings, while behaving identically to
the keys they mirror.

**Independent Test**: Click the G4 row (spot becomes G4). Click the on-screen **2** button —
verify B4 is appended and the spot stays G4. Click the **−/+ toggle** (display flips to "−"),
click the **1** button — verify F4 is appended (one row below G4).

**Acceptance Scenarios**:

1. **Given** the spot is set, **When** the user clicks the on-screen **1**, **2**, or **3**
   button, **Then** a note that many staff positions from the spot (in the current direction) is
   added, exactly as the corresponding digit key would do, **and** the spot does not move.
2. **Given** the direction is "+", **When** the user clicks the −/+ toggle, **Then** the
   direction becomes "−", the toggle's displayed state updates, and subsequent digit-key and
   button presses step downward — until the toggle is clicked again or `+` is pressed.
3. **Given** the direction was changed via the keyboard (`+`/`-`), **When** the user looks at
   the toggle, **Then** it displays the same current direction (keyboard and toggle never
   disagree).
4. **Given** the page has just loaded or "Clear all" was pressed, **Then** direction defaults to
   "+" (ascending) and the toggle displays it.
5. **Given** any spot, **When** the user looks at the staff, **Then** the spot's row is visually
   distinguishable from other rows (e.g. a marker), and it moves when — and only when — the spot
   moves.

---

### User Story 3 - Absolute entry remains, and letter keys also move the spot (Priority: P3)

A user who wants to jump to a distant range still uses the existing absolute entry: letter keys
C–B at the current octave, `[`/`]` to change that octave, and Shift for sharps — unchanged from
today. Because a letter key *adds a note at a chosen pitch*, that pitch also becomes the new
spot — the same as if the user had clicked that row. Octave keys, duration keys, undo, and rests
never move the spot.

**Why this priority**: Keeps the feature purely additive for existing users, while making
letter entry consistent with staff clicks (both are "I picked this exact pitch" gestures, so
both re-anchor the spot).

**Independent Test**: With the spot at C4, press `E` — verify `E4` is appended, the spot
becomes E4, and pressing `1` next adds F4. Press `[` — verify only the octave display changes
(spot untouched).

**Acceptance Scenarios**:

1. **Given** a fresh page (spot C4), **When** the user presses a letter key, **Then** a note is
   added at that letter + current octave exactly as today, **and** the spot becomes that note.
2. **Given** any spot, **When** the user presses `[` or `]`, **Then** only the current-octave
   display changes; the spot is unaffected.
3. **Given** any spot, **When** the user presses Shift+letter for a sharp (e.g. Shift+C →
   C♯4), **Then** the sharp note is added as today, and the spot is set to the sharp's natural
   staff row (C4) — since relative steps only land on natural rows.
4. **Given** any spot, **When** the user presses Undo (Z) or adds a rest, **Then** the melody
   changes accordingly but the spot is unaffected.

---

### Edge Cases

- **Boundary clamp**: a relative step that would move above the staff's topmost drawn note (D6)
  or below its bottommost (B3) clamps to that boundary note instead of erroring, extending the
  staff, or silently doing nothing. (Spot C4 + `-` + `6` → C4; spot G4 + `+` + `6` → C5... any
  overflow lands on D6/B3.)
- **Fresh page**: relative-step keys and buttons work immediately — there is no "no spot yet"
  state, because the spot always exists (defaults to C4).
- **Undo (Z)**: pops the last melody token only. The spot does not revert or move — it is
  independent of melody content.
- **Duration**: duration selection (sticky, cycled via `,` / `.` or `Tab`/`Shift+Tab`) is
  completely independent of pitch entry; the active duration applies to notes added via digit
  keys, step buttons, letter keys, and staff clicks alike.
- **`/` or `q`**: resets the current duration directly to Quarter (1 beat). Spot and direction
  are unaffected.
- **Clear all**: clears the melody, resets the spot to C4, and resets direction to "+".
  Duration is unaffected (matches today's behavior).
- **Rests**: adding a rest (`_`) does not move the spot.
- **Sharps**: relative steps never land on sharps (natural rows only); a sharp entered via
  Shift+letter moves the spot to that letter's natural row (see US3 scenario 3).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Clicking a note position on the staff MUST continue to add that note to the
  melody (unchanged from today) and MUST additionally set it as the current spot.
- **FR-002**: The spot MUST default to C4 on page load. There is no "unset" state — the spot
  always exists, so relative-step entry always works.
- **FR-003**: Number keys `0`–`6` are relative-step keys: pressing digit *N* adds a new note *N*
  staff positions from the current spot, in the current Direction. `0` repeats the spot's own
  row (Direction has no effect at a step of 0), and `` ` `` (backtick) is an alias for `0`.
- **FR-004**: Direction is toggled by two dedicated keys, `-` and `=` (either one flips it — no
  Shift needed; their shifted forms `_`/`+` toggle too, being the same physical keys), and by
  the on-screen toggle (FR-013). It is a **persistent mode**: once flipped, it stays in effect
  for all subsequent relative-step presses until flipped again.
- **FR-005**: Direction MUST default to "+" on page load and after "Clear all".
- **FR-006**: Relative steps MUST be counted in staff positions — one natural-letter step per
  unit, the same rows a user can click — not semitones. A step never lands on a sharp.
- **FR-007**: The spot MUST change **only** when (a) a staff row is clicked, or (b) a note is
  added via letter-key entry (natural or sharp). It MUST NOT change when a note is added via a
  relative-step key or step button, nor when direction, duration, or octave keys are used, nor
  on undo or rest entry.
- **FR-008**: The existing absolute entry (letter keys C–B, Shift for sharp, `[`/`]` for octave
  change) MUST keep working exactly as it does today, at all times. A note added this way sets
  the spot per FR-007(b); a sharp sets the spot to its natural staff row.
- **FR-009**: Duration selection MUST apply to notes added via relative-step keys and step
  buttons the same way it applies to letter-key or staff-click notes.
- **FR-010**: Undo (Z) MUST remove the last melody token exactly as today and MUST NOT change
  the spot.
- **FR-011**: A relative step that would move past the staff's drawn range MUST clamp to the
  nearest boundary note (B3 or D6) rather than failing or extending the staff.
- **FR-012**: The page MUST provide on-screen step buttons **1**, **2**, and **3**, each
  behaving identically to the corresponding digit key (add a note that many staff positions
  from the spot in the current direction; the spot does not move).
- **FR-013**: The page MUST provide a single on-screen **−/+ toggle** that displays the current
  direction and flips it when clicked. Its displayed state MUST stay in sync with direction
  changes made via the `+`/`-` keys.
- **FR-014**: The current spot MUST be visible at all times: as a text readout (e.g. "Spot:
  C4") **and** as a visual marker on the spot's staff row, both updating immediately whenever
  the spot changes.
- **FR-015**: "Clear all" MUST clear the melody, reset the spot to C4, and reset direction to
  "+". Duration is unaffected (today's behavior).
- **FR-016**: Duration selection stays on `,` (previous) / `.` (next), wrapping, with
  `Tab`/`Shift+Tab` continuing to work unchanged. Selection is sticky across entry modes.
- **FR-017**: Pressing `/` or `q` MUST reset the duration selection directly to Quarter (1
  beat), regardless of where the cycle currently sits.
- **FR-018**: Pressing `h` MUST jump the duration selection directly to Half (2 beats),
  regardless of where the cycle currently sits — mirroring `q` for Quarter ("h" for Half).
- **FR-019**: Each duration option's on-screen button hint MUST display that duration's numeric
  beat value — 0.5, 1, 1.5, 2, 3, 4 — instead of a keycode digit.

### Key Entities

- **Spot**: The staff row (letter + octave, naturals only) used as the reference point for
  relative entry. Defaults to C4; set only by a staff click or a letter-key note addition;
  never moved by relative-step keys/buttons, direction, duration, octave, undo, or rests;
  always visible (readout + staff marker).
- **Direction**: A two-state (`+` / `-`) persistent setting — changed by the `+`/`-` keys or the
  on-screen toggle — determining whether a relative step counts up or down from the spot.
  Defaults to `+`.
- **Relative step**: A count of staff positions (0–6 on the keyboard, 1–3 on the on-screen
  buttons, `` ` `` as an alias for `0`) from the spot, combined with the current Direction, to
  determine the pitch of the next note added. Adding it never moves the spot.
- **Duration**: The sticky note-length selection (0.5/1/1.5/2/3/4 beats), cycled with `Tab`/
  `Shift+Tab` or `,`/`.`, resettable to Quarter with `/` or `q`, applied to whichever note is
  added next regardless of entry mode.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With the spot visible, a user can add each nearby note with a single keypress or
  button click, without choosing a letter or checking the octave display.
- **SC-002**: A user can enter a 5-note ascending run from a fresh page in 5 gestures (one
  staff click + four digit/button presses `1`–`4`), never touching the octave controls.
- **SC-003**: Pressing the same relative-step key repeatedly adds the same pitch repeatedly
  (spot fixed) — verifiable in two presses; this is the round-2 behavior the round-1 build did
  not exhibit.
- **SC-004**: Every relative-entry action is achievable by mouse alone (staff click + step
  buttons + direction toggle) and by keyboard alone, with identical results.
- **SC-005**: A first-time user can state the current spot and direction at any moment by
  looking at the page — no hidden state.
- **SC-006**: All pre-existing absolute-entry actions (letter keys, sharps, octave keys, sticky
  duration, undo) produce identical results to before this feature — zero regressions.

## Assumptions

- "Staff position" means one row of the existing staff SVG (the same set of pitches a user can
  click directly) — one natural-letter step per relative-step increment.
- The spot is per-page-load, in-memory state only; nothing is persisted.
- Staff clicks still **add** the clicked note (today's behavior) in addition to moving the spot.
- Because the spot never advances on relative entry, pressing the same digit/button *N* times in
  a row adds the same pitch *N* times — this is intended (it is exactly the round-2 request),
  and runs are entered by pressing *different* magnitudes (e.g. `1`, `2`, `3`) or by mixing in
  letter keys/clicks.
- Sharps are out of scope for relative-step landing positions; a sharp entered via Shift+letter
  moves the spot to the sharp letter's natural row (C♯4 → C4) for stepping purposes.
- On-screen step buttons cover magnitudes 1–3 only (the requested set); the keyboard keeps the
  full 0–6 range plus the `` ` `` alias.
- The existing melody data format and output text box are unchanged; relative entry only changes
  how a note's pitch is chosen before it's appended.
- `q` remains an alias for `/` (reset duration to Quarter); `` ` `` remains an alias for the
  relative-step key `0`.
- Letter keys other than `q`, plus `[`/`]`, `Z`, `Tab`, and `Shift+Tab`, are unchanged in their
  existing meaning; `0`–`6`, `` ` ``, `,`, `.`, `/`, `q`, `+`, and `-` keep their round-1
  meanings — only the *reference-point semantics* (fixed spot vs. chained anchor) and the new
  on-screen controls are changing in round 2.
