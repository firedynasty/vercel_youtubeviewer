# Feature Specification: Inline Card Lyrics with Sequential Navigation

**Feature Branch**: `003-note-card-lyrics-load`

**Created**: 2026-09-12

**Status**: Implemented (revised 2026-09-13, round 5 — `lyricsInput` and both of round 4's
buttons are removed entirely; lyrics are entered only by clicking a card, with `,`/`.` moving the
same in-card editor to the next/previous card)

**Input (round 1)**: "In public/note_builder.html, add inline per-card lyric editing and a 'Load
combined' action that parses an exported notes+lyrics string back into the melody and note strip."

**Input (round 2)**: "I'm trying to make it as easy as possible to load and to load
from a certain spot. P2 I don't need to rebuild. I get the melody then I put in the lyrics then
export combined — that's the actual workflow. Instead: a button that can trigger backwards from
the cards to the input — I write in a few cards and the empty cards port back as
`do,you,know,,,,,`."

**Input (round 3)**: "I need `lyricsInput` not to update [the cards] on type. [Add] a
new button before BPM that will regenerate [the cards' state into the input] — so there's an
up→ [input drives cards] and a back← [cards drive input] direction — I'm asking for the back←
[only] at the moment... only build back←, then typing into lyricsInput will do nothing at all
[to the cards] — yes, do nothing at all."

**Input (round 4)**: "Why won't you let me type in lyricsInput? I can still update the
cards with a button after [typing in] the input, please — make that button part of the plan,
because I don't want to update the cards as I type in the input."

**Input (round 5 — current)**: "I don't even need [the 'Sync to input' button]... ['Apply to
cards'] needs to be renamed so [typing happens on the cards themselves, not lyricsInput], and
then add `,`/`.` [to] go back and forth the cards ... to navigate ... and clicking on the card
will set from where `,` and `.` can move." Then, on a follow-up clarification: "I think you
misunderstand — should be because I can input directly in the cards, I don't need lyricsInput at
all."

**Round-2 delta**: Round 1 assumed the user wanted to *import* a previously-exported combined
string to rebuild the whole melody and note strip in one shot. The actual workflow never
imports — it's always melody first, then lyrics, then a one-way "Export combined" read-out.
"Loading from a certain spot" turns out to describe User Story 1 itself (clicking directly on
whichever card you want, rather than counting positions from the start) — not a separate
mechanism.

**Round-3 delta**: Round 2's design still had typing into `lyricsInput` live-drive the cards
(today's existing behavior, kept as a "bulk entry" path alongside per-card editing). Round 3
removed that entirely: typing into `lyricsInput` has no live effect on any card. At that point an
"up→" button (apply `lyricsInput`'s text to the cards on demand) was named as a possible future
companion but marked out of scope.

**Round-4 delta**: Round 3 over-corrected — removing live-typing was correct, but removing every
path from `lyricsInput` to the cards along with it was not what the user wanted. Round 4 added
"Apply to cards" (up→) and "Sync to input" (back←) as a pair of explicit buttons.

**Round-5 delta (why this revision exists, and supersedes round 4)**: Once per-card click-to-edit
(User Story 1) existed, `lyricsInput` and both round-4 buttons turned out to be unnecessary
scaffolding — the user can already type directly on any card. What was actually missing was a
fast way to move from card to card *while* typing, without a mouse click per card. Round 5
removes `lyricsInput`, "Apply to cards", and "Sync to input" entirely, and instead teaches the
existing inline per-card edit box two new keys: `,` commits the current card and opens the next
card's edit box; `.` commits the current card and opens the previous one — so a user can click
once, then type a whole sequence of lyrics separated by `,` without touching the mouse again.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a specific card's lyric directly on the card (Priority: P1)

A user has built a melody and wants to attach a lyric to one particular note — not necessarily
the next unfilled one in sequence. The user clicks directly on the note-card that should carry
the word, an edit spot opens on that card, they type the word, and it's saved to that card
without touching any other card's lyric.

**Why this priority**: This is the core problem reported — there is no external list to keep in
sync or count positions against; the card you click is the card you edit. Everything else
(sequential navigation in User Story 2) builds on this.

**Independent Test**: Build any melody of 3+ notes, click the second note-card, type a word,
confirm it — verify only that card shows the word and other cards are unchanged. Click the same
card again, change the word, confirm — verify it updates in place. Add another note to the melody
afterward — verify the earlier per-card edit is still there.

**Acceptance Scenarios**:

1. **Given** a note strip with several note-cards and no lyrics yet, **When** the user clicks (or
   keyboard-activates, via `Tab` + `Enter`/`Space`) a note-card, **Then** an inline edit spot
   appears on that card ready for text entry.
2. **Given** the inline edit spot is open on a card, **When** the user types a word and presses
   Enter (or clicks/tabs elsewhere to blur), **Then** the word is saved as that card's lyric, the
   edit spot closes, and the word is visible on the card.
3. **Given** a card already has a lyric, **When** the user clicks it, **Then** the edit spot opens
   pre-filled with the existing word so it can be changed or cleared.
4. **Given** the inline edit spot is open, **When** the user presses Escape, **Then** the edit spot
   closes and the card's lyric is unchanged from before the click.
5. **Given** the user saves an empty value, **When** the edit spot closes, **Then** the card's
   lyric is removed (the card shows no word).
6. **Given** a lyric was set by clicking a card, **When** the user later adds another note to the
   melody, undoes a note, or otherwise changes the melody, **Then** the previously set per-card
   lyric is still attached to its card (not reset or lost by the change).
7. **Given** any set of per-card lyrics, **When** the user runs "Export combined", **Then** the
   output reflects whichever lyric is currently on each card.

---

### User Story 2 - Move between cards with `,` / `.` while typing (Priority: P2)

Having clicked one card to start, a user wants to enter lyrics for a whole run of cards without
reaching for the mouse again. While the inline edit spot is open, pressing `,` saves the current
word and immediately opens the edit spot on the **next** card (to the right); pressing `.` saves
the current word and opens the edit spot on the **previous** card (to the left). Clicking a card
still works exactly as in User Story 1 — it just also becomes the new starting point for `,`/`.`
navigation.

**Why this priority**: This depends on User Story 1's edit spot existing at all. It turns "click
every card" into "click once, then type a whole sequence," which is the fast path for entering
lyrics across many cards in order — directly requested after the user confirmed they don't need
any separate input field at all.

**Independent Test**: Build a melody of 5+ notes, click card 0, type "hello", press `,` — verify
card 0 now shows "hello" and the edit spot has moved to card 1. Type "good", press `,` — verify
card 1 shows "good" and editing has moved to card 2. Press `.` — verify editing moves back to
card 1 and its edit box is pre-filled with "good".

**Acceptance Scenarios**:

1. **Given** the edit spot is open on card `i` (`i` not the last card), **When** the user presses
   `,`, **Then** the typed text is saved as card `i`'s lyric and the edit spot opens on card
   `i + 1`, pre-filled with card `i + 1`'s current lyric (or empty).
2. **Given** the edit spot is open on card `i` (`i` not the first card), **When** the user presses
   `.`, **Then** the typed text is saved as card `i`'s lyric and the edit spot opens on card
   `i - 1`, pre-filled with card `i - 1`'s current lyric (or empty).
3. **Given** the edit spot is open on the **last** card, **When** the user presses `,`, **Then**
   the typed text is saved as that card's lyric and the edit spot simply closes (there is no next
   card to move to).
4. **Given** the edit spot is open on the **first** card, **When** the user presses `.`, **Then**
   the typed text is saved as that card's lyric and the edit spot simply closes (there is no
   previous card to move to).
5. **Given** a user clicks card 0, types "hello", presses `,`, types "good", presses `,`, types
   "work", presses `,`, **Then** cards 0/1/2 read "hello"/"good"/"work" and the edit spot is now
   open on card 3, empty — matching the shape of the user's own worked example.
6. **Given** the edit spot is open, **When** the user types a literal `,` or `.` character,
   **Then** it is treated as a navigation command (per Scenarios 1–4), never inserted into the
   lyric text — lyrics cannot contain `,` or `.`.

### Edge Cases

- Clicking one card while another card's edit spot is already open with unsaved text: the open
  edit spot saves (or clears, if left empty — see Story 1 Scenario 5) before the new one opens,
  so only one card is ever being edited at a time. The same commit-then-move behavior applies to
  `,`/`.` navigation (Story 2).
- A lyric containing a comma or period: not supported (see Story 2 Scenario 6) — `,` and `.` are
  reserved as navigation keys while the edit spot is open, exactly as `:` is already reserved by
  "Export combined"'s output format.
- Rapid repeated clicks on the same card: only one edit spot for that card is ever shown; a
  second click while it's already open keeps editing (does not open a duplicate or reset the
  text already typed).
- Pressing `,` or `.` when no edit spot is open (e.g., focus elsewhere on the page): has no
  effect — navigation only applies while a card's edit spot has focus.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to click (or keyboard-activate) any note-card in the note strip
  to open an inline, on-card text entry for that card's lyric.
- **FR-002**: The inline edit entry MUST pre-fill with the card's current lyric, if any, so it can
  be edited rather than always starting blank.
- **FR-003**: Confirming the inline edit (Enter, or moving focus away) MUST save the entered text
  as that card's lyric and MUST NOT change the lyric of any other card.
- **FR-004**: Canceling the inline edit (Escape) MUST leave the card's lyric exactly as it was
  before the edit was opened.
- **FR-005**: Saving an empty value MUST remove the card's lyric (equivalent to it never having
  had one).
- **FR-006**: A lyric set by clicking a card MUST remain attached to that card through later
  melody changes (adding/undoing/clearing notes re-renders the strip, but must not discard
  per-card lyrics that are still valid for their card's position).
- **FR-007**: "Export combined" MUST derive each note's lyric from that note-card's current lyric
  directly (the per-card state the strip renders from).
- **FR-008**: While the inline edit spot is open, pressing `,` MUST save the current card's text
  and open the edit spot on the next card (index + 1), pre-filled with its current lyric — unless
  there is no next card, in which case the edit spot simply closes after saving.
- **FR-009**: While the inline edit spot is open, pressing `.` MUST save the current card's text
  and open the edit spot on the previous card (index − 1), pre-filled with its current lyric —
  unless there is no previous card, in which case the edit spot simply closes after saving.
- **FR-010**: Pressing `,` or `.` while the edit spot is open MUST NOT insert a literal comma or
  period character into the lyric text — both keys are reserved for navigation only.
- **FR-011**: There is no separate lyrics input field, and no bulk/list-based way to set lyrics —
  every lyric is set by opening a card's own edit spot (directly, or by navigating to it via
  `,`/`.`) and typing into it.

### Key Entities

- **Note Card**: One entry in the note strip; carries a note name (e.g. `F4`), a duration
  (e.g. quarter note), and an optional lyric (a single word/syllable). Position in the strip is
  significant — cards are ordered left to right as the melody plays, and `,`/`.` step through
  that same order.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can assign a lyric to any single, arbitrarily-chosen note-card in under 5
  seconds, without affecting any other card's lyric and without counting positions.
- **SC-002**: A user can enter lyrics for an entire melody by clicking once and then alternating
  typing with `,` (or `.` to go back and fix something), never touching the mouse again.
- **SC-003**: A melody edit made after some cards already have lyrics never causes an existing
  per-card lyric to disappear from its card.
- **SC-004**: Users no longer need to count note positions, retype a full comma-separated list, or
  use any control other than the cards themselves to get lyrics onto the melody.

## Assumptions

- Lyrics are limited to text that does not itself contain a comma (`,`), period (`.`), or colon
  (`:`) — `,`/`.` are reserved as navigation keys while editing (FR-010), and `:` is reserved by
  "Export combined"'s output format.
- This feature only changes `public/note_builder.html` (client-side only, no build step, no new
  dependencies), consistent with how the rest of that file is built.
- This feature is independent of and does not modify the already-shipped
  002-relative-note-entry feature (fixed-spot relative note entry keybindings) in the same file.
- No import/rebuild-from-a-combined-string capability is in scope for this feature (dropped in
  round 2) — "Export combined" remains a one-way, read-only output.
- No separate lyrics input field, bulk-entry mechanism, or cards→field sync exists as of round 5
  — these were built in round 4 and explicitly removed once per-card editing plus `,`/`.`
  navigation made them redundant.
