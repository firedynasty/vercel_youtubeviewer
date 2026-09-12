# Interface Contract: Staff Editor Keybindings & Controls

`public/note_builder.html` has no API — its interface *is* its keyboard + on-screen control
contract, consumed directly by the user. This document is the authoritative table for that
contract, scoped to the global `keydown` handler and the staff panel's buttons. All key
bindings are ignored while focus is in a `TEXTAREA`/`INPUT`, or while a modifier key
(`Meta`/`Ctrl`/`Alt`) is held — this guard already exists and is unchanged (research.md §3).

Round 2 changes the **semantics of the reference point** (fixed Spot, default C4, moved only by
staff clicks and letter keys) and adds **on-screen controls**; no key gains or loses a binding
relative to the round-1 build.

## Keyboard Bindings

| Key | Before round 1 | Current (round 2) | Changed in round 2? |
|---|---|---|---|
| `C` `D` `E` `F` `G` `A` `B` | Add natural note at current octave | *(same)* **+ sets the Spot** to that note (FR-007b, FR-008) | Behavior extended (round 2: spot now explicit; letter entry still re-anchors, as round 1) |
| `Shift`+`C`/`D`/`F`/`G`/`A` | Add sharp at current octave | *(same)* **+ sets the Spot** to the sharp's natural row (e.g. `C#4` → spot `C4`) | Behavior extended |
| `[` | Octave down (min 1) | *(unchanged — Spot unaffected)* | No |
| `]` | Octave up (max 8) | *(unchanged — Spot unaffected)* | No |
| `Z` | Undo last note | *(unchanged — pops melody only; **Spot no longer reverts**, it is not melody-derived)* | Semantics simplified (was "anchor reverts" in round 1) |
| `0` | *(unbound)* | Add note at the **Spot's own row** (repeat) | Spot semantics only |
| `1`–`6` | Set duration (round-1) → relative step (round-1, chained anchor) | Add note **N staff-rows from the Spot**, in current Direction; **Spot does not move** (FR-003, FR-007) | **Yes — reference is fixed Spot, not last note** |
| `` ` `` (backtick) | *(unbound)* | Alias for `0` — repeat the Spot's row | Spot semantics only |
| `-` | *(unbound)* | **Toggle** Direction (flip `+` ⇄ `-`); toggle label re-renders | **Yes — toggle, not explicit-set (round 3)** |
| `=` | *(unbound)* | **Toggle** Direction — same physical-key pair as `-`/`+`; no Shift needed | **New (round 3)** |
| `_` / `+` (Shift+`-` / Shift+`=`) | *(unbound)* | **Toggle** Direction — same physical keys as `-`/`=` | **New (round 3)** |
| `Tab` / `Shift+Tab` | Cycle duration forward/backward | *(unchanged)* | No |
| `,` / `.` | *(unbound)* | Duration previous/next, wrapping (aliases of `Shift+Tab`/`Tab`) | No |
| `/` | *(unbound)* | Duration → reset directly to Quarter (1) | No |
| `q` | *(unbound)* | Alias for `/` — reset duration to Quarter | No |
| `h` | *(unbound)* | Duration → jump directly to Half (2) — mirrors `q` for Quarter ("h" for Half) | **New (round 3)** |
| *(staff row click)* | Add that note | Add that note **and set the Spot to it** (FR-001) | Same as round 1, but Spot is now the *only* persistent reference |

## On-Screen Controls (new in round 2)

| Control | Action | Contract |
|---|---|---|
| Step buttons **1**, **2**, **3** | click | Identical to digit keys `1`–`3`: add a note that many staff-rows from the Spot in the current Direction; **Spot does not move** (FR-012). Implemented by calling the same `relativeStep(n)` the keys call (research.md §7). |
| **−/+ toggle** (`#dirToggle`) | click | Flips Direction (`'+' ⇄ '-'`); label always displays the current Direction, including after `-`/`=` key presses (FR-013). |
| Spot readout (`Spot: C4`) | — (display) | Always shows the current Spot name; updates immediately on staff click, letter entry, and Clear all (FR-014). |
| Spot staff marker | — (display) | The Spot's row carries a persistent accent-colored marker in the SVG, redrawn by `drawStaff()` whenever the Spot changes (FR-014). |
| Duration buttons | click | *(unchanged)* sticky selection; hint text shows beat values `0.5`–`4` (FR-019). |

## Behavior Details

- **Fixed Spot**: the Spot defaults to **C4** on page load and after "Clear all" — relative
  entry works immediately, with no priming click (FR-002). It moves **only** on a staff-row
  click or a letter-key note addition (FR-007). Repeated identical step presses therefore add
  repeated identical pitches — intended behavior (SC-003); runs are entered with different
  magnitudes (`1`, `2`, `3`…) or by mixing clicks/letter keys.
- **Direction** is a persistent mode: flipped by the `-` or `=` key (either one toggles, no
  Shift needed; their shifted forms `_`/`+` toggle too) or by the on-screen toggle, and it
  applies to every subsequent step until changed (irrelevant at step 0). Defaults to `+` on
  load and after "Clear all" (FR-005).
- **Duration** (`Tab`/`Shift+Tab`, `,`/`.`, `/`, `q`, buttons) is fully independent of
  Spot/Direction and applies to "the next note added" by any entry mode (FR-009).
- **Clamping**: a step that would pass the staff's drawn range (below `B3`, above `D6`) lands on
  the boundary note instead of erroring (FR-011).
- **Undo** pops the last melody token only; the Spot is unaffected (FR-010).
- **Clear all** clears the melody, resets Spot → C4 and Direction → `+`; duration untouched
  (FR-015).

## Non-Goals (explicitly out of scope)

- Sharps are not reachable as relative-step *landing positions* (steps only land on natural
  staff rows — FR-006). Use `Shift`+letter for a sharp, same as today.
- On-screen step buttons cover magnitudes 1–3 only (the requested set); magnitudes 0, 4, 5, 6
  remain keyboard-only.
- No persistence: Spot/Direction reset on reload.
