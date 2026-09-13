# Quickstart: Inline Card Lyrics with Sequential Navigation

Manual browser validation — this repo has no automated test harness for `public/*.html` galleries
(see `002-relative-note-entry`'s plan for the same note; this feature's implementation was also
verified programmatically via a throwaway jsdom harness during development — see the PR/session
notes — but a real-browser pass is still worth doing for visual/CSS confirmation). Open
`public/note_builder.html` directly in a browser for each scenario below.

## Prerequisites

- A melody already on the page. Fastest way: paste directly into the `melodyOut` textarea:
  `F4:1, F4:1, F4:2, G4:1, G4:1, E4:1, G4:1, F4:1` (8 notes) and let it render (type/backspace a
  trailing space to trigger the `input` event, or press Play once).

## Scenario 1 — Click a specific card and set its lyric (US1, SC-001)

1. Click the 3rd note-card (index 2, the `F4` with a half-note duration).
2. Type `hear` and press Enter.
3. **Expect**: only that card shows "hear"; cards 0, 1, and 3+ show no lyric change.
4. Click card 0, type `do`, press Enter. Click card 1, type `you`, press Enter.
5. **Expect**: cards 0, 1, 2 now read do / you / hear; nothing else changed.

## Scenario 2 — Re-edit and clear a card's lyric (US1 Scenarios 3–5)

1. Click card 0 (currently "do"). **Expect**: the edit spot opens pre-filled with "do", selected.
2. Change it to `oh` and press Enter. **Expect**: card 0 now shows "oh".
3. Click card 0 again, select all, delete, press Enter (or blur). **Expect**: card 0 shows no
   lyric.
4. Click card 1 ("you"), type `zzz`, press **Escape**. **Expect**: card 1 still shows "you"
   (the Escape'd edit did not save).

## Scenario 3 — Lyrics survive a melody change (US1 Scenario 6 / FR-006, SC-003)

1. With cards 0–2 set to do/you/hear from Scenario 1, add a new note to the melody (append
   `A4:1` to `melodyOut` and let it re-render, or click a staff row then press Play once to force
   a render).
2. **Expect**: cards 0–2 still read do/you/hear; the new note appears as an additional card with
   no lyric.
3. Click "Undo last". **Expect**: the added note's card is removed; cards 0–2 still read
   do/you/hear, unaffected.

## Scenario 4 — Sequential entry with `,` (US2, SC-002)

1. Starting fresh (Clear all), paste a melody of 5 notes.
2. Click card 0. Type `hello`, press `,`.
3. **Expect**: card 0 shows "hello"; the edit spot has moved to card 1 (focused, empty).
4. Type `good`, press `,`. **Expect**: card 1 shows "good"; edit spot now on card 2.
5. Type `work`, press `,`. **Expect**: card 2 shows "work"; edit spot now on card 3, empty —
   matching the shape of the example used while specifying this feature.
6. Confirm the whole sequence never required touching the mouse after the initial click.

## Scenario 5 — Navigating back with `.` (US2 Scenarios 2/4)

1. Continuing from Scenario 4 (edit spot open on card 3), press `.`.
2. **Expect**: edit spot moves to card 2, pre-filled with "work".
3. Press `.` twice more. **Expect**: edit spot lands on card 0, pre-filled with "hello".
4. Press `.` once more (card 0 is the first card). **Expect**: the edit spot simply closes — no
   error, no wraparound to the last card.

## Scenario 6 — Boundary at the last card with `,` (US2 Scenario 3)

1. Click the last card in the strip. Type a word, press `,`.
2. **Expect**: the word is saved to that card, and the edit spot closes (there is no next card).

## Scenario 7 — `,` and `.` are reserved, never typed literally (US2 Scenario 6)

1. Click any card and try to type a `,` or `.` as part of a word.
2. **Expect**: neither character appears in the input — each immediately commits and navigates
   instead, per Scenarios 4–6.

## Scenario 8 — "Export combined" reads the cards (FR-007)

1. Using the cards from Scenario 4 (hello/good/work on cards 0–2, rest empty), run
   "Export combined".
2. **Expect**: the output is `hello:<note0>:<dur0>, good:<note1>:<dur1>, work:<note2>:<dur2>, <note3>:<dur3>, <note4>:<dur4>`
   (lyrics only on the cards that have them), matching whatever notes/durations are on the strip.

## Scenario 9 — No separate lyrics field exists (round 5)

1. Look at the Lyrics toolbar row.
2. **Expect**: there is no text input, no "Apply to cards" button, and no "Sync to input" button —
   only the note-cards themselves, a short help label, and the existing BPM/Play/Stop controls.

## Pass criteria

All nine scenarios behave exactly as described, with no console errors, and "Export combined"
never produces output shifted or misaligned relative to what's visibly on the cards at that
moment.
