# Implementation Plan: Click-Anchored Relative Note Entry (Fixed-Spot Model)

**Branch**: `002-relative-note-entry` | **Date**: 2026-09-12 (revised 2026-09-12, round 2) | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-relative-note-entry/spec.md`

## Summary

`public/note_builder.html`'s staff editor enters notes absolutely (letter+octave) and, since
round 1 of this feature, also relatively — but round 1 derived the reference point from the
last melody note, so digit keys were dead on a fresh page and every added note re-anchored the
next step. Round 2 (this revision, per user feedback) replaces that with a **fixed spot**: an
explicit reference row that **defaults to C4 on page load**, moves **only** when a staff row is
clicked or a letter key adds a note, and is never advanced by the relative-step keys
(`0`–`6`/`` ` ``) or the new **on-screen step buttons 1/2/3**. Direction stays a persistent
`+`/`-` mode, now also exposed as a single on-screen **−/+ toggle**, and the spot is always
visible (text readout + staff-row marker). Duration stays on `,`/`.`/`/`/`q` (round-1 remap,
already shipped). All absolute-entry keybindings are unchanged. Client-side-only change to one
static HTML file — no new dependencies, no build step, no server/API surface.

## Technical Context

**Language/Version**: Vanilla JavaScript (ES6+, browser-native), inline in HTML — no transpilation/build step, matching the file's existing style.

**Primary Dependencies**: None added. Uses only existing browser APIs already in use in the file (DOM, inline SVG, `document.addEventListener('keydown', …)`).

**Storage**: N/A — melody state lives in the `#melodyOut` textarea's text content, exactly as today; this feature adds no persistence.

**Testing**: Manual browser verification via the scenarios in `quickstart.md` (no automated test harness exists for `public/*.html` galleries in this repo; `package.json`'s `react-scripts test` only covers the separate CRA/`src/` shell and is out of scope here).

**Target Platform**: Desktop web browsers, keyboard-driven (matches the file's current keyboard-first design).

**Project Type**: Single static HTML page, edited in place. No new files, routes, or projects.

**Performance Goals**: Keypress-to-note-added feedback stays perceptually instant (<16ms) — same as today's direct DOM/SVG updates; no network calls are introduced.

**Constraints**: Must not change the meaning of any keybinding not explicitly called out in the spec (letters C–B, Shift-sharp, `[`/`]`, `Z`). Must not introduce a build step or dependency (Constitution IV). Must remain a self-contained static file deployable to Vercel with zero config (Constitution V).

**Scale/Scope**: One file (`public/note_builder.html`, ~850 lines). Round-2 changes: replace the
textarea-derived anchor with an explicit `spot` state variable (default `'C4'`) plus a single
`setSpot()` helper called from exactly two places (staff-click handler, letter-key handler);
remove the no-anchor no-op guard; add a spot readout + SVG spot-row marker; add three step
buttons and a direction-toggle button wired to the same handlers as the keys; reset spot in
"Clear all". Round-1 duration remap (`,`/`.`/`/`/`q`, beat-value hints) is already shipped and
untouched. No new files except this feature's `specs/` artifacts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Result |
|---|---|---|
| I. Content-Pipeline Authority | No content (text/video/image) is added; nothing bypasses `process_*.py`. | ✅ N/A — pure interaction-logic change |
| II. Modular, Self-Contained Sections | Change is entirely within `note_builder.html`; no other section's runtime state is touched or depended on. | ✅ Pass |
| III. Accessibility by Default | Every new on-screen control (step buttons, direction toggle) mirrors an existing/new keyboard binding one-for-one; nothing becomes mouse-only, and keyboard users keep a complete path. | ✅ Pass (directly advances this principle) |
| IV. No Over-Engineering (YAGNI) | No new abstractions, libraries, or build tooling; extends the existing `keydown` handler and duration-button logic in place. | ✅ Pass |
| V. Vercel-Native Deployment | Still a static file under `public/`; no env vars, no server code. | ✅ Pass |

No violations. Complexity Tracking is not needed.

*Post-Phase-1 re-check (round 2): the revised design in `research.md`, `data-model.md`,
`contracts/keybindings.md`, and `quickstart.md` introduces no new dependency, no new file, and
no mouse-only control — the table above still holds unchanged after the fixed-spot redesign.*

## Project Structure

### Documentation (this feature)

```text
specs/002-relative-note-entry/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command) — keybinding contract
└── tasks.md             # Phase 2 output (/speckit-tasks command — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
public/
└── note_builder.html    # Single file modified: explicit `spot` state + setSpot()/setDirection()
                          # helpers, keydown handler (existing), staff-click handler (also sets
                          # spot), SVG spot-row marker in drawStaff(), new step-button row +
                          # direction toggle + spot readout markup, "Clear all" spot reset
```

**Structure Decision**: No new source files or directories. This is an in-place edit of the
single existing static HTML page `public/note_builder.html`, consistent with Constitution II
(self-contained sections) and IV (no new build surface). All feature-specific documentation
lives under `specs/002-relative-note-entry/` per the standard spec-kit layout.

## Complexity Tracking

*No Constitution Check violations — this section is intentionally empty.*
