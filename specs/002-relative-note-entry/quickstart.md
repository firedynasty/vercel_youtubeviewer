# Quickstart: Validating Click-Anchored Relative Note Entry (Fixed-Spot Model)

## Prerequisites

- No build step, no server, no dependencies to install.
- Open `public/note_builder.html` directly in a browser (double-click the file, or serve the
  repo's `public/` directory with any static file server if you prefer `http://` over `file://`).

## Setup

```bash
open public/note_builder.html   # macOS; or just drag the file into a browser tab
```

There is nothing to build or restart — this is a static HTML file, edited and reloaded directly.

## Validation Scenarios

Run these in order against a freshly loaded page to exercise every acceptance scenario in
[spec.md](./spec.md). Each references the requirement it proves. The round-2 invariants to keep
in mind while testing: **the Spot starts at C4, moves only on staff click or letter-key entry,
and never moves on digit keys, step buttons, or direction changes.**

### 1. Fresh-page Spot + fixed-Spot stepping (US1, FR-002, FR-003, FR-007, SC-003)

1. Load the page; touch nothing. **Expect**: the Spot readout shows `C4` and the C4 staff row
   carries the spot marker (FR-002, FR-014).
2. Press `1`. **Expect**: `D4:1` appended to the Output box — relative entry works with no
   priming click — and the Spot readout **still shows C4**.
3. Press `1` twice more. **Expect**: two more `D4` notes appended (three identical notes total)
   — the Spot did not advance (FR-007, SC-003).
4. Press `3`. **Expect**: `F4` appended (3 staff-rows above C4), Spot still C4.
5. Press `0`, then `` ` ``. **Expect**: two `C4` notes appended (Spot's own row repeated,
   Direction irrelevant), Spot still C4.

### 2. Click moves the Spot; steps re-measure from it (US1, FR-001)

1. Click the `G4` row. **Expect**: `G4:1` appended; Spot readout and staff marker move to G4.
2. Press `2`. **Expect**: `B4` appended (2 rows above G4); Spot stays G4.
3. Click the `E5` row. **Expect**: `E5` appended; Spot moves to E5.
4. Press `1`. **Expect**: `F5` appended — measured from the new Spot, not from G4.

### 3. Visualized controls: step buttons + direction toggle (US2, FR-012, FR-013, FR-014, SC-004)

1. With the Spot at E5 (from scenario 2), click the on-screen **2** button. **Expect**: `G5`
   appended — identical to pressing `2`; Spot stays E5.
2. Click the **−/+ toggle**. **Expect**: the toggle's displayed direction flips to `−`.
3. Click the **1** button. **Expect**: `D5` appended (1 row below E5).
4. Press `+` on the keyboard. **Expect**: the toggle's displayed direction returns to `+`
   (keyboard and toggle never disagree, FR-013).
5. Press `-`, then press digit `3`. **Expect**: `B4` appended (3 rows below E5).

### 4. Absolute entry still works; letter keys move the Spot (US3, FR-008)

1. Press `[` twice. **Expect**: octave display drops to 2; no note added; **Spot unchanged**.
2. Press `C`. **Expect**: `C2` appended; Spot readout/marker move to C2.
3. Press `] ]` (back to octave 4), then `E`. **Expect**: `E4` appended; Spot moves to E4.
4. Press `1`. **Expect**: `F4` appended — measured from E4.
5. Press `Shift+C`. **Expect**: `C#4` appended (sharp entry unchanged); Spot shows **C4** — the
   sharp's natural row (FR-008).
6. Press `1`. **Expect**: `D4` appended.

### 5. Undo, rests, and Clear-all (FR-010, FR-015)

1. Note the current Spot (C4, from scenario 4). Press `Z` twice. **Expect**: the last two
   melody tokens are removed; the Spot readout does not change (FR-010).
2. Click "Add rest (_)". **Expect**: `_:1` appended; Spot unchanged.
3. Click "Clear all". **Expect**: Output box empties, Spot readout returns to **C4**, direction
   toggle shows **+** (FR-015). Press `1` — `D4` is appended, confirming the reset state.

### 6. Boundary clamping (FR-011)

1. Click the topmost row `D6`, press `+` (if needed), then press `6` three times. **Expect**:
   every note is `D6` — steps clamp at the top boundary instead of erroring or extending the
   staff.
2. Click the bottommost row `B3`, press `-`, then press `6` three times. **Expect**: every note
   is `B3` — clamped at the bottom boundary.

### 7. Duration remap — regression check (FR-009, FR-016, FR-017, FR-018, FR-019)

1. **Expect**: each duration button's hint reads `0.5`, `1`, `1.5`, `2`, `3`, `4` (not `1`–`6`).
2. Press `.` repeatedly, then `Tab`. **Expect**: active duration advances and wraps, identically
   for both keys.
3. Press `,` then `Shift+Tab`. **Expect**: both move backward through the list the same way.
4. Move duration off Quarter, press `/`. **Expect**: jumps directly back to Quarter. Repeat with
   `q` — same result. Move duration off Half, press `h`. **Expect**: the active button jumps
   directly to Half (`2`), regardless of where the cycle was (FR-018).
5. With a non-Quarter duration active, click a staff row, press a digit key, click a step
   button, and press a letter key. **Expect**: all four notes carry that same duration
   (FR-009).
6. Press `2` with the Spot set. **Expect**: a note is added 2 rows from the Spot — the digit
   does **not** change duration.

## Expected Outcome

All seven scenarios pass with no console errors. The round-2 invariants hold throughout: Spot
defaults to C4, is always visible, moves only on staff click or letter-key entry, and is never
advanced by digit keys, step buttons, direction changes, octave keys, undo, or rests. Existing
letter/`[`/`]`/`Z`/click/duration behaviors are otherwise indistinguishable from production.
