# Phase 0 Research: Click-Anchored Relative Note Entry (Fixed-Spot Model)

Round 1 resolved the interaction unknowns (step keys `0`–`6`, persistent `+`/`-` direction,
diatonic staff-position steps, duration remap to `,`/`.`/`/`). Round 2 (this revision) resolves
the one question round 1 got wrong, per direct user feedback: **what the reference point is and
when it moves.** Decisions 1 and 6 below reverse their round-1 counterparts; Decisions 2–5 are
unchanged and already shipped; Decisions 7–9 are new (visualized controls, spot display,
undo/clear semantics).

## 1. Representing the Spot — explicit state, not derived (REVERSES round-1 Decision 1)

- **Decision**: Hold the spot in a module-scope variable — `let spot = 'C4'` — mutated only
  through a `setSpot(name)` helper. Remove `getAnchorRow()` and its textarea parsing entirely.
- **Rationale**: The round-1 derivation (anchor = last token of `#melodyOut`) is structurally
  incapable of the round-2 requirements: (a) FR-002 demands a valid spot (C4) on a fresh page,
  when the textarea is empty — a derived anchor is `null` there by construction; (b) FR-007
  demands that relative-step entry **not** move the reference, but deriving from the last token
  re-anchors on *every* addition, which is exactly the "walking" behavior the user reported as
  wrong. Meanwhile the parallel-state risk that motivated derivation in round 1 has collapsed:
  the spot now mutates at exactly two call sites (staff click, letter-key entry), both funneled
  through one helper, so there is nothing to drift.
- **Alternatives considered**: (i) Keep textarea derivation and add a separate "locked" flag —
  rejected: two interlocked states reproducing one concept, and still no fresh-page default.
  (ii) Derive from the last token but only when a new `spotLocked` flag is unset — rejected for
  the same reason: the user's model has no mode in which the melody tail defines the spot.

## 2. Diatonic Step Lookup (unchanged)

- **Decision**: Reuse the existing `rows` array (ordered top-to-bottom, `D6` first → `B3` last,
  naturals only) as the step space. A step of *N* in direction *D* resolves to
  `rows[clamp(indexOf(spot) + (D === '+' ? -N : +N), 0, rows.length - 1)]` — ascending pitch
  means a *smaller* array index.
- **Rationale**: `rows` already *is* "one entry per clickable staff position, naturals only"
  (FR-006), and `Math.max`/`Math.min` index clamping directly implements FR-011.
- **Alternatives considered**: Semitone/MIDI calculation — rejected (Constitution IV); steps are
  diatonic by spec.

## 3. Keydown Handler Extension Point (unchanged)

- **Decision**: Keep the single existing `document.addEventListener('keydown', …)` block with
  its guards (ignore `TEXTAREA`/`INPUT` targets; ignore `Meta`/`Ctrl`/`Alt` chords). The digit,
  `+`/`-`, `,`/`.`/`/`/`q` branches stay as shipped in round 1; only the digit branch's anchor
  source changes (Decision 1) and its no-anchor guard is removed (Decision 6).
- **Rationale**: Guards are already correct for every binding in the feature; a second listener
  risks disagreeing about focus state.
- **Alternatives considered**: SVG-scoped listener — rejected; keys must work regardless of
  focus, as today.

## 4. Duration Remap (`,` / `.` / `/` / `q`) — shipped, untouched

- Round-1 decision stands: number row freed for relative steps; `Tab`/`Shift+Tab` untouched;
  `,`/`.` reuse the existing `.dur-btn` array + wrap-around `.click()` cycling; `/` and `q`
  `.click()` the `data-dur="1"` button directly. No round-2 changes.

## 5. Duration Button Hint Labels — shipped, untouched

- Round-1 decision stands: each `.dur-btn`'s `<small>` hint shows its own `data-dur` beat value
  (`0.5`, `1`, `1.5`, `2`, `3`, `4`). No round-2 changes.

## 6. Fresh-Page Behavior — spot always exists (REVERSES round-1 Decision 6)

- **Decision**: Delete the "no anchor → no-op" guard from the digit-key branch. `spot` is
  initialized to `'C4'` at script load and reset to `'C4'` by "Clear all", so a valid reference
  exists at every moment; the branch always resolves and always adds a note.
- **Rationale**: FR-002/FR-007 make the guard unreachable by construction — keeping it would be
  dead code implying a state that can no longer occur.
- **Alternatives considered**: Keep the guard as a safety net — rejected; dead code that
  contradicts the spec's "there is no unset state" is worse than no code.

## 7. Visualized Controls — one code path for keys and buttons

- **Decision**: Extract the digit branch's body into `relativeStep(n)` (`addNote(resolveStep(spot,
  n))`) and call it from both the `keydown` digit branch and three new `<button class="step-btn"
  data-step="1|2|3">` click handlers. Add one `#dirToggle` button whose click handler flips
  `direction` (`'+' ⇄ '-'`) and whose label is re-rendered by the same `setDirection(d)` helper
  the `+`/`-` keys call — so keyboard and toggle can never display different states.
- **Rationale**: FR-012/FR-013 demand key/button parity; a single shared function per action is
  the only way parity is structural rather than remembered. Buttons live in the left panel
  directly under the staff SVG (next to the thing they reference), matching the existing
  `.btn-row` styling.
- **Alternatives considered**: (i) Buttons that synthesize/dispatch keyboard events — rejected;
  indirection through `keydown` guards makes behavior harder to reason about than a direct call.
  (ii) Two separate `+` and `-` buttons — rejected; the user asked for a single toggle, and one
  control that *shows* the current state doubles as the direction readout.

## 8. Spot Display — readout + staff marker

- **Decision**: (a) A text readout (`Spot: <b id="spotDisplay">C4</b>`) inline with the new
  button row. (b) A persistent marker in the SVG: `drawStaff()` draws an accent-colored notehead
  ellipse (reusing the existing `--accent` purple, `rx≈9, ry≈6.5`, at `X_NOTE`, spot row's `y`)
  on the spot's row each render. `setSpot()` updates the variable, the readout text, and calls
  `drawStaff()`.
- **Rationale**: FR-014 requires the spot to be always visible; drawing the marker inside the
  existing `drawStaff()` (already re-run wholesale on octave change — it's a cheap full
  `innerHTML` rebuild of ~50 SVG nodes) keeps exactly one render path, so marker, readout, and
  state cannot disagree. No incremental SVG patching.
- **Alternatives considered**: (i) Text readout only — rejected; the whole point of the staff is
  spatial, and the user asked to *visualize* the model. (ii) CSS-tinting the spot row's hit rect
  persistently — rejected as the sole signal; hover already uses that tint, so a marker is less
  ambiguous. (Either may be layered on later; not needed for the contract.)

## 9. Undo, Rests, and Clear-all with an explicit spot

- **Decision**: Undo (`Z`/`#undoBtn`) keeps doing exactly what it does today (pop last token,
  step the rhythm queue back) and touches nothing spot-related — the round-1 "undo restores the
  anchor" requirement disappears with derivation. The rest button is likewise spot-neutral.
  "Clear all" gains one line: `setSpot('C4')` alongside its existing `direction = '+'` reset
  (routed through `setDirection('+')` so the toggle label refreshes).
- **Rationale**: FR-010/FR-015. With the spot decoupled from melody content, undo has no
  reference-point bookkeeping to do — the simplest possible semantics, and what the user's
  "only clicking on the staff changes it" implies.
- **Alternatives considered**: Snapshotting/restoring the spot on undo — rejected; it
  reintroduces melody↔spot coupling the user explicitly removed, for no requested benefit.
