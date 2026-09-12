# Data Model: Click-Anchored Relative Note Entry (Fixed-Spot Model)

This feature has no persisted or server-side data — everything below is transient, in-page
JavaScript state inside `public/note_builder.html`. Round 2 replaces the round-1 *derived*
Anchor with an explicit **Spot** variable.

## Entities

### Spot

The staff row used as the reference point for relative-step entry. Always exists.

| Field | Type | Derivation / Rule |
|---|---|---|
| `spot` | one of `rows[].name` (e.g. `"C4"`, `"G4"`) — natural rows only | Module-scope variable, initialized `'C4'` at script load (FR-002). Mutated **only** via `setSpot(name)`, called from exactly two places: the staff-row click handler (passes the clicked row's name) and the letter-key branch (passes the entered note's name with any `#` stripped — see Validation). Also reset to `'C4'` by "Clear all" (FR-015). |

**Validation rules**:
- `spot` is always a valid `rows[].name`; it can never be `null`, empty, a rest (`_`), or a
  sharp name. Sharp letter entry (e.g. `C#4`) sets the spot to the sharp's **natural row**
  (`C4`) — the `#` is stripped at `setSpot` time, so the readout always names a clickable row
  and `resolveStep`'s `findIndex` always hits (FR-008).
- Never mutated by: relative-step keys/buttons, `+`/`-` keys or the direction toggle, duration
  keys, octave keys, undo, or rest entry (FR-007, FR-010).

**State transitions**:

```text
page load ──► 'C4' ◄────────────────────── "Clear all"
                │
   staff click on row R ──► R
   letter key adds note N ──► naturalRow(N)
                │
   (digit keys / step buttons / direction / duration /
    octave / undo / rest  ──►  no transition)
```

### Direction

A persistent two-state flag controlling which way a relative step counts from the Spot.

| Field | Type | Rule |
|---|---|---|
| `direction` | `'+' \| '-'` | Module-scope variable (exists today). `'+'` on page load and after "Clear all" (FR-005). **Flipped** by the `-`/`=` keys (either toggles; shifted forms `_`/`+` toggle too) and by the on-screen `#dirToggle` button (FR-013). All mutations go through `setDirection(d)` so the toggle's label re-renders on every change — keyboard and on-screen state cannot disagree. |

**State transitions**:

```text
        press "+" (or toggle from '-')
   ┌────────────────────────────────────┐
   │                                     v
[ '+' ] ◄───────────────────────────── [ '-' ]
   │      press "-" (or toggle from '+')
   └─────────────────────────────────────►
(initial / post-Clear-all state: '+'; toggle label always mirrors current state)
```

### Relative Step (transient input, not stored)

A single gesture — digit key `0`–`6`, `` ` `` (alias for `0`), or a step-button click (1–3) —
interpreted at the moment it fires.

| Concept | Type | Rule |
|---|---|---|
| `magnitude` | integer 0–6 | The digit pressed (`0` if `` ` ``), or the clicked button's `data-step`. `0` resolves to the spot's own row; Direction is irrelevant at magnitude 0. |
| resolved target | `rows[]` index | `clamp(indexOf(rows, spot) + (direction === '+' ? -1 : +1) * magnitude, 0, rows.length - 1)`. *(`rows` is ordered top-to-bottom — `D6` first, `B3` last — so ascending means a **smaller** index.)* Clamped into range, never out of bounds (FR-011). |
| side effects | none on Spot | Resolving and adding the note MUST NOT change `spot` (FR-007) — repeated identical steps add repeated identical pitches (intended round-2 behavior, SC-003). |

**Validation rules**:
- No "no spot" guard exists or is needed — `spot` is always valid (FR-002, research.md §6).

### Duration

The existing sticky note-length selection (round-1 remap already shipped; unchanged in round 2).

| Field | Type | Rule |
|---|---|---|
| `duration` (existing variable) | one of `"0.5" \| "1" \| "1.5" \| "2" \| "3" \| "4"` | Unchanged in meaning and storage. `,`/`.` cycle previous/next (wrapping, aliases of `Shift+Tab`/`Tab`); `/` or `q` jump directly to `data-dur="1"` (FR-016, FR-017); `h` jumps directly to `data-dur="2"` Half (FR-018). Applies to whichever note is added next, regardless of entry mode (FR-009). Button hints display the beat values (FR-019). |

No relationship exists between Duration and Spot/Direction — disjoint key sets, read
independently by `addNote()` (pitch from the entry mode; duration from `duration`).

## Relationships

```text
 staff click on row R ──► addNote(R) ──► appendToTextarea(R + ':' + duration)
                    └───► setSpot(R) ──► readout + staff marker redraw

 letter key adds note N ──► addNote(N) ──► appendToTextarea(...)
                      └───► setSpot(naturalRow(N))

 digit key / step button (magnitude m) ──► addNote(resolveStep(spot, m))
                                    (spot unchanged)

 "+"/"-" keys, #dirToggle click ──► setDirection(...) ──► toggle label re-render
                                    (spot unchanged)

 ","/"."/"/"/"q"/"h", Tab/Shift+Tab ──► duration (existing variable; spot, direction unchanged)

 Undo ──► pop last #melodyOut token only        (spot unchanged)
 "Clear all" ──► clear textareas, setSpot('C4'), setDirection('+')
```
