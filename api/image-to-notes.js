import { timingSafeEqual } from 'node:crypto';

const PROMPT = `You are reading a page of printed sheet music. Transcribe it literally, exactly as engraved.
Report only what is visible; do not guess, do not "fix" the music, do not invent notes.
Return JSON:
{
  "keySignature": integer (number of sharps as a positive number, number of flats as a negative number, 0 for none),
  "timeSignature": string like "3/4" or null,
  "staves": [
    {
      "clef": "treble" | "bass",
      "measures": [
        [ event, event, ... ]
      ]
    }
  ]
}
List every staff once (a piano grand staff is two staves: the upper one, then the lower one). Go left to right, system by system, top to bottom; "measures" holds one array per bar, in order.
Each event is one of:
  {"type":"note","letter":"A-G","octave":integer (middle C = C4),"accidental":"#"|"b"|"n"|"","value":"whole"|"half"|"quarter"|"eighth"|"sixteenth","dots":0|1,"triplet":true|false}
  {"type":"rest","value":"whole"|"half"|"quarter"|"eighth"|"sixteenth","dots":0|1,"triplet":true|false}
  {"type":"chord","pitches":[{"letter":"A-G","octave":integer,"accidental":"#"|"b"|"n"|""}, ...],"value":...,"dots":...,"triplet":...}
Rules:
- "accidental" is ONLY an accidental drawn next to that note; never put the key signature's sharps or flats there. Use "" when none is drawn.
- "triplet" is true for notes under a triplet bracket or marked with a 3.
- Every beam group in a triplet passage is a triplet even when the "3" is printed only over some of the groups, so flag all of them.
- Notes stacked on one stem (or sharing a stem) are a chord: list every pitch of it in "pitches".
- Before answering, check that each bar's values add up to the time signature, and fix your reading if they don't.
- Ignore fingering numbers, lyrics, titles, tempo text and dynamics.`;

// Models the page may request; anything else falls back to the default
const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4.1', 'gpt-5.4-mini', 'gpt-5.4', 'gpt-5.5'];
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-5.4';

const VALUE_BEATS = { whole: 4, half: 2, quarter: 1, eighth: 0.5, sixteenth: 0.25 };
const SHARP_ORDER = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

// letter -> '#' | 'b' implied by the key signature
function keySignatureMap(fifths) {
  const map = {};
  if (fifths > 0) SHARP_ORDER.slice(0, Math.min(fifths, 7)).forEach((l) => (map[l] = '#'));
  if (fifths < 0) FLAT_ORDER.slice(0, Math.min(-fifths, 7)).forEach((l) => (map[l] = 'b'));
  return map;
}

// Beats are computed in code (quarter = 1) rather than trusted from the model
function beatsOf(ev) {
  const base = VALUE_BEATS[ev.value];
  if (!base) return null;
  let beats = base * (ev.dots === 1 ? 1.5 : 1);
  if (ev.triplet === true) beats *= 2 / 3;
  return Math.round(beats * 1000) / 1000;
}

function validPitch(p) {
  return p && /^[A-G]$/.test(p.letter) && Number.isInteger(p.octave) && p.octave >= 0 && p.octave <= 8;
}

// "3/4" -> 3 beats (quarter = 1); null when unreadable
function beatsPerBar(timeSignature) {
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(String(timeSignature || ''));
  return m && +m[2] > 0 ? (+m[1] * 4) / +m[2] : null;
}

const barTotal = (bar) => bar.reduce((t, ev) => t + (beatsOf(ev) || 0), 0);

// Models often forget the triplet flag on some groups. If a bar doesn't add up but does once its
// plain eighth notes are treated as triplets, take that reading; otherwise leave the bar as read.
function repairBar(bar, expected) {
  if (expected === null || Math.abs(barTotal(bar) - expected) < 0.02) return bar;
  const fits = (b) => Math.abs(barTotal(b) - expected) < 0.02;
  const tripled = bar.map((ev) => (ev.type !== 'rest' && ev.value === 'eighth' && !ev.dots && !ev.triplet ? { ...ev, triplet: true } : ev));
  if (fits(tripled)) return tripled;
  // Still over: a rest is often read one step too long (a triplet eighth rest seen as a quarter rest).
  // Try shrinking a single rest by one step, with or without the triplet flag, and keep a fit.
  const SMALLER = { whole: 'half', half: 'quarter', quarter: 'eighth', eighth: 'sixteenth' };
  for (const base of [tripled, bar]) {
    for (let i = 0; i < base.length; i++) {
      if (base[i].type !== 'rest' || !SMALLER[base[i].value]) continue;
      for (const triplet of [true, false]) {
        const trial = base.map((ev, j) => (j === i ? { ...ev, value: SMALLER[ev.value], dots: 0, triplet } : ev));
        if (fits(trial)) return trial;
      }
    }
  }
  return bar;
}

// Turn the model's report into "E4:1, _:0.5, F#4:0.333" for one staff.
// The key signature and per-bar accidentals are applied here, not by the model.
function staffToSequence(staff, fifths, timeSignature) {
  const keyMap = keySignatureMap(fifths);
  const expected = beatsPerBar(timeSignature);
  const tokens = [];
  const warnings = [];
  for (let b = 0; b < staff.measures.length; b++) {
    if (!Array.isArray(staff.measures[b])) return null;
    if (staff.measures[b].some((ev) => beatsOf(ev) === null)) return null;
    const bar = repairBar(staff.measures[b], expected);
    const total = Math.round(barTotal(bar) * 1000) / 1000;
    if (expected !== null && Math.abs(total - expected) >= 0.02) {
      warnings.push(`bar ${b + 1} adds up to ${total} beats, expected ${expected}`);
    }
    const barAcc = {}; // letter+octave -> accidental, lasts until the barline
    for (const ev of bar) {
      const beats = beatsOf(ev);
      if (ev.type === 'rest') {
        tokens.push(`_:${beats}`);
        continue;
      }
      let p;
      if (ev.type === 'note') p = ev;
      else if (ev.type === 'chord' && Array.isArray(ev.pitches) && ev.pitches.length) {
        // The sequence format is one note at a time: keep the top note of a chord
        p = ev.pitches.reduce((hi, c) => (validPitch(c) && c.octave * 7 + 'CDEFGAB'.indexOf(c.letter) > hi.octave * 7 + 'CDEFGAB'.indexOf(hi.letter) ? c : hi), ev.pitches[0]);
      } else return null;
      if (!validPitch(p)) return null;
      const key = p.letter + p.octave;
      if (p.accidental === '#' || p.accidental === 'b' || p.accidental === 'n') barAcc[key] = p.accidental;
      const acc = key in barAcc ? barAcc[key] : keyMap[p.letter] || 'n';
      tokens.push(`${p.letter}${acc === '#' ? '#' : acc === 'b' ? 'b' : ''}${p.octave}:${beats}`);
    }
  }
  return { sequence: tokens.join(', '), warnings };
}

// Each call spends OpenAI credit, so it needs the shared ACCESS_CODE. Fails closed if it isn't configured.
function checkAccessCode(req, res) {
  const expected = process.env.ACCESS_CODE;
  if (!expected) {
    res.status(500).json({ error: 'ACCESS_CODE not set on server.' });
    return false;
  }
  const given = String(req.headers['x-access-code'] || '');
  const a = Buffer.from(given), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Wrong access code' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!checkAccessCode(req, res)) return;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  const { image, model, staff } = req.body || {};
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Expected "image" as a data:image/... URL' });
  }
  const wantClef = staff === 'bass' ? 'bass' : 'treble';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: image, detail: 'high' } }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(502).json({ error: data?.error?.message || 'OpenAI request failed' });
    }

    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    const fifths = Number.isInteger(parsed.keySignature) ? parsed.keySignature : 0;
    const staves = Array.isArray(parsed.staves) ? parsed.staves : [];
    const chosen = staves.find((s) => s && s.clef === wantClef && Array.isArray(s.measures));
    if (!chosen) {
      return res.status(422).json({ error: `No ${wantClef}-clef staff found in the model's reply`, raw: parsed });
    }

    const result = staffToSequence(chosen, fifths, parsed.timeSignature);
    if (!result) {
      return res.status(422).json({ error: 'Model returned an invalid note', raw: chosen });
    }

    return res.status(200).json({
      sequence: result.sequence,
      warnings: result.warnings,
      keySignature: fifths,
      timeSignature: parsed.timeSignature || null,
      bars: chosen.measures.length,
      model: ALLOWED_MODELS.includes(model) ? model : DEFAULT_MODEL
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
