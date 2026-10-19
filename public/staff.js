// Shared staff drawing for pianoIndex.html and note_builder.html.
// Draws the treble voice (and the optional bass voice) as notation. Both voices share one set of columns,
// one per note onset on a 1/24-beat grid, so bar lines and simultaneous notes line up and a voice that is
// out by a beat shows as a bar line that doesn't match. With one voice the staff is treble, plus a bass
// staff only when a note is below middle C. With two voices the treble list is always the upper staff and
// the bass list the lower. A chord is "E3+G3+B3:0.5". No key signature in the sequence format, so every
// ♯/♭ is written as an accidental (repeats within a bar are dropped).
// Usage: const staff = StaffView.create({ scroller, onNoteClick }); staff.render(trebleItems, bassItems, { beatsPerBar, pickup });
(function (global) {
  const NS = 'http://www.w3.org/2000/svg';
  const SP = 10;                       // one staff space in px
  const LETTER = { C:0, D:1, E:2, F:3, G:4, A:5, B:6 };
  const DURS = [ // beats, kind, dots, triplet
    [6,'whole',1], [4,'whole',0], [3,'half',1], [2,'half',0], [1.5,'quarter',1], [1,'quarter',0],
    [0.75,'eighth',1], [0.5,'eighth',0], [0.375,'sixteenth',1], [1/3,'eighth',0,true], [0.25,'sixteenth',0], [1/6,'sixteenth',0,true]
  ];
  const MID_C = 28;                    // diatonic index of C4
  const TICKS_PER_BEAT = 24;           // time is counted in 1/24 beats so triplets never drift between voices
  function toTicks(beats) { return Math.max(1, Math.round(beats * TICKS_PER_BEAT)); }

  // The note colours and the orange "playing" dot; the page's own .playing rule (it scales the keyboard keys)
  // would otherwise shift an SVG group, so cancel it here.
  function injectStyle() {
    if (document.getElementById('staff-view-style')) return;
    const st = document.createElement('style');
    st.id = 'staff-view-style';
    st.textContent = '.staff-note{color:#ddd}.staff-note.playing{transform:none;box-shadow:none}.staff-note .play-dot{display:none}.staff-note.playing .play-dot{display:inline}.staff-note.selected{color:#4aa3ff}.staff-note .sel-ring{display:none}.staff-note .sel-ring.on{display:inline}';
    document.head.appendChild(st);
  }

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(str, attrs, parent) {
    const t = el('text', attrs, parent);
    t.textContent = str;
    return t;
  }

  function pitchOf(noteStr) {
    const m = String(noteStr).trim().toUpperCase().match(/^([A-G])(#|B)?(\d)?$/);
    if (!m) return null;
    return { letter: m[1], acc: m[2] === '#' ? 1 : m[2] === 'B' ? -1 : 0, oct: m[3] === undefined ? 4 : +m[3] };
  }
  function classify(beats) {
    if (beats > 5) return { kind: 'whole', dots: 1, triplet: false };
    let best = DURS[0];
    DURS.forEach(d => { if (Math.abs(d[0] - beats) < Math.abs(best[0] - beats)) best = d; });
    return { kind: best[1], dots: best[2], triplet: !!best[3] };
  }

  // One voice's events with integer start ticks (1/24 beat), so triplet sums never drift between voices
  function buildVoice(parsed, voice, bpbT, shift) {
    const evs = [], marks = [];
    let t = 0, acc = {}, accBar = -1;
    parsed.forEach((item, i) => {
      if (item && item.type === 'section') { marks.push({ tick: t, label: String(item.label) }); return; }
      const noteStr = item && typeof item === 'object' ? item.note : item;
      const beats = item && typeof item === 'object' ? (item.beats || 1) : 1;
      // "E3+G3+B3" is a chord: several noteheads on one stem
      const parts = noteStr === '_' ? [] : String(noteStr).split('+').map(pitchOf).filter(Boolean);
      const ev = { voice, i, beats, tick: t, dt: toTicks(beats), lyric: (item && item.lyric) || '', rest: noteStr === '_', p: parts[0] || null, dur: classify(beats) };
      ev.bar = bpbT ? Math.floor((t + shift) / bpbT) : 0;
      ev.bi = Math.floor((t + shift) / TICKS_PER_BEAT);
      if (parts.length) {
        if (ev.bar !== accBar) { acc = {}; accBar = ev.bar; }
        ev.heads = parts.map(p => {
          const key = p.letter + p.oct;
          const prev = acc[key] || 0;
          const accidental = prev !== p.acc ? (p.acc === 1 ? '♯' : p.acc === -1 ? '♭' : '♮') : '';
          acc[key] = p.acc;
          return { d: p.oct * 7 + LETTER[p.letter], accidental };
        }).sort((a, b) => a.d - b.d);
        ev.dBot = ev.heads[0].d;
        ev.dTop = ev.heads[ev.heads.length - 1].d;
        ev.d = Math.round((ev.dBot + ev.dTop) / 2);   // which staff and stem direction use the middle of the chord
        ev.accCount = ev.heads.filter(h => h.accidental).length;
      }
      t += ev.dt;
      evs.push(ev);
    });
    return { evs, marks, total: t };
  }

  function layout(trebleParsed, bassParsed, opts) {
    const bpb = parseFloat(opts.beatsPerBar) || 0;
    const bpbT = Math.round(bpb * TICKS_PER_BEAT);
    const pickupT = bpbT ? Math.min(Math.round((parseFloat(opts.pickup) || 0) * TICKS_PER_BEAT), bpbT - 1) : 0;
    const shift = pickupT > 0 ? bpbT - pickupT : 0;
    const v1 = buildVoice(trebleParsed, 'treble', bpbT, shift);
    const v2 = buildVoice(bassParsed, 'bass', bpbT, shift);
    const total = Math.max(v1.total, v2.total);

    const colMap = new Map();
    const colAt = tick => { let c = colMap.get(tick); if (!c) { c = { tick, evs: [], labels: [] }; colMap.set(tick, c); } return c; };
    [v1, v2].forEach(v => {
      v.evs.forEach(e => { const c = colAt(e.tick); c.evs.push(e); e.col = c; });
      v.marks.forEach(m => colAt(m.tick).labels.push(m.label));
    });
    const cols = [...colMap.values()].sort((a, b) => a.tick - b.tick);
    cols.forEach((c, k) => {
      const next = k + 1 < cols.length ? cols[k + 1].tick : c.tick + Math.max(0, ...c.evs.map(e => e.dt));
      const dBeats = (next - c.tick) / TICKS_PER_BEAT;
      c.pad = Math.max(0, ...c.evs.map(e => e.accCount ? 12 + 11 * (e.accCount - 1) : 0));
      const lyricW = Math.max(0, ...c.evs.map(e => e.lyric ? e.lyric.length * 6.5 + 8 : 0));
      c.labW = c.labels.reduce((s, l) => s + 24 + l.length * 7, 0);
      c.w = c.evs.length ? Math.max(26 + 14 * Math.min(dBeats, 4) + (c.evs.some(e => e.dur.dots) ? 6 : 0), lyricW) + c.pad : 0;
    });

    let x = 48, nextBar = bpbT ? (pickupT || bpbT) : Infinity;
    const bars = [];
    cols.forEach(c => {
      while (nextBar <= c.tick) { bars.push(x + 2); x += 10; nextBar += bpbT; }
      c.labX = x;
      c.x = x + c.labW;
      c.cx = c.x + c.pad + 10;
      x = c.x + c.w;
    });
    while (bpbT && nextBar <= total) { bars.push(x + 2); x += 10; nextBar += bpbT; }
    return { v1, v2, cols, bars, width: x + 30, twoVoice: v2.evs.length > 0 };
  }

  // Draws both voices into scroller. opts: { beatsPerBar, pickup, onNoteClick({ voice, i, tick }) }
  function render(scroller, trebleParsed, bassParsed, opts) {
    scroller.innerHTML = '';
    if (!trebleParsed.length && !bassParsed.length) {
      scroller.innerHTML = '<div style="color:#555;font-size:13px;padding:16px;">Enter a sequence — the staff appears here.</div>';
      return;
    }
    const L = layout(trebleParsed, bassParsed, opts);
    const twoVoice = L.twoVoice;
    const all = [...L.v1.evs, ...L.v2.evs];
    const notes = all.filter(e => e.p);
    const needBass = twoVoice || notes.some(e => e.d < MID_C);
    const staffOf = e => twoVoice ? (e.voice === 'bass' ? 'bass' : 'treble') : (needBass && e.d < MID_C ? 'bass' : 'treble');
    const maxD = Math.max(38, ...notes.filter(e => staffOf(e) === 'treble').map(e => e.dTop));
    const minD = Math.min(18, ...notes.filter(e => staffOf(e) === 'bass').map(e => e.dBot));
    const hasLyrics = all.some(e => e.lyric);
    const T = 4 * SP + Math.max(0, (maxD - 38) / 2) * SP;
    const trebleBottom = T + 4 * SP;
    const B0 = T + (twoVoice ? 12 : 10) * SP;
    const bottomLine = needBass ? B0 + 4 * SP : trebleBottom;
    const lowest = bottomLine + (needBass ? Math.max(0, (18 - minD) / 2) * SP : 0) + 4 * SP;
    const lyricY = lowest + SP;
    const H = lyricY + (hasLyrics ? 2 * SP : 0) + SP;
    const svg = el('svg', { width: L.width, height: H, viewBox: `0 0 ${L.width} ${H}` });
    svg.style.display = 'block';

    // d → y on each staff (treble bottom line E4 = 30, bass bottom line G2 = 18)
    const yTreble = d => trebleBottom - (d - 30) * SP / 2;
    const yBass = d => B0 + 4 * SP - (d - 18) * SP / 2;
    const yAtD = (e, d) => staffOf(e) === 'bass' ? yBass(d) : yTreble(d);
    const midOf = e => staffOf(e) === 'bass' ? 22 : 34;

    const lines = el('g', { stroke: '#777', 'stroke-width': 1 }, svg);
    for (let k = 0; k < 5; k++) {
      el('line', { x1: 4, x2: L.width - 6, y1: T + k * SP, y2: T + k * SP }, lines);
      if (needBass) el('line', { x1: 4, x2: L.width - 6, y1: B0 + k * SP, y2: B0 + k * SP }, lines);
    }
    const fontStack = "'Noto Music','Apple Symbols','Segoe UI Symbol','Bravura Text',serif";
    text('𝄞', { x: 8, y: T + 3 * SP + 3, 'font-size': 6.4 * SP, fill: '#bbb', 'font-family': fontStack }, svg);
    if (needBass) {
      text('𝄢', { x: 8, y: B0 + 3 * SP, 'font-size': 5 * SP, fill: '#bbb', 'font-family': fontStack }, svg);
      el('line', { x1: 4, x2: 4, y1: T, y2: B0 + 4 * SP, stroke: '#777', 'stroke-width': 1.5 }, svg);
    }
    L.bars.forEach(bx => {
      el('line', { x1: bx, x2: bx, y1: T, y2: needBass ? B0 + 4 * SP : trebleBottom, stroke: '#777', 'stroke-width': 1 }, svg);
    });

    // beam groups, per voice: consecutive flagged notes inside one beat of one bar
    const flagged = e => e.p && (e.dur.kind === 'eighth' || e.dur.kind === 'sixteenth');
    const groups = [];
    [L.v1.evs, L.v2.evs].forEach(list => {
      let cur = null;
      list.forEach(e => {
        if (flagged(e) && cur && cur[0].bar === e.bar && cur[0].bi === e.bi) cur.push(e);
        else if (flagged(e)) { cur = [e]; groups.push(cur); }
        else cur = null;
      });
    });
    const groupOf = new Map();
    groups.forEach(g => g.forEach(e => groupOf.set(e, g)));
    groups.forEach(g => {
      const avg = g.reduce((s, e) => s + (e.d - midOf(e)), 0) / g.length;
      g.down = avg >= 0;
    });

    const neutral = el('g', { stroke: '#ddd', fill: '#ddd' }, svg);

    L.cols.forEach(c => {
      let lx = c.labX;
      c.labels.forEach(label => {
        el('line', { x1: lx + 4, x2: lx + 4, y1: T - 2, y2: bottomLine + 2, stroke: '#4caf50', 'stroke-width': 2 }, svg);
        text(label, { x: lx + 10, y: T - 10, 'font-size': 12, fill: '#4caf50', 'font-family': 'sans-serif' }, svg);
        lx += 24 + label.length * 7;
      });
    });

    all.forEach(e => {
      const isBass = e.voice === 'bass';
      const g = el('g', { class: 'staff-note ' + (isBass ? 'b' : 't'), 'data-voice': isBass ? 'bass' : 'treble', 'data-i': e.i, 'data-x': e.col.cx, stroke: 'currentColor', fill: 'currentColor' }, svg);
      // each voice's clickable area is limited to its own staff, so the two voices in one column don't steal each other's clicks
      const splitY = needBass ? (trebleBottom + B0) / 2 : H;
      const onBassStaff = staffOf(e) === 'bass';
      el('rect', { x: e.col.x, y: onBassStaff ? splitY : 0, width: Math.max(e.col.w, 20), height: onBassStaff ? H - splitY : splitY, fill: 'transparent', stroke: 'none' }, g);
      if (opts.onNoteClick) {
        g.style.cursor = 'pointer';
        // a click right on a notehead also says which note of a chord it was (head); otherwise head is null
        g.addEventListener('click', ev => {
          const hk = ev.target && ev.target.getAttribute ? ev.target.getAttribute('data-head') : null;
          opts.onNoteClick({ voice: e.voice, i: e.i, tick: e.tick, head: hk === null ? null : +hk });
        });
      }
      if (e.lyric) text(e.lyric, { x: e.col.cx, y: lyricY, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor', stroke: 'none', 'font-family': 'sans-serif' }, g);

      if (!e.p) { // rest (or unreadable token — leave blank)
        if (!e.rest) return;
        const bassRest = staffOf(e) === 'bass';
        const mid = bassRest ? yBass(22) : yTreble(34), k = e.dur.kind, cx = e.col.cx;
        el('circle', { class: 'play-dot', cx, cy: mid, r: 3.4, fill: '#ff9f1c', stroke: 'none' }, g);
        el('circle', { class: 'sel-ring', 'data-head': 0, cx, cy: mid, r: 11, fill: 'none', stroke: '#4aa3ff', 'stroke-width': 1.5 }, g);
        if (k === 'whole') el('rect', { x: cx - 6, y: mid - SP, width: 12, height: 5, stroke: 'none' }, g);
        else if (k === 'half') el('rect', { x: cx - 6, y: mid - 5, width: 12, height: 5, stroke: 'none' }, g);
        else if (k === 'quarter') el('path', { d: `M${cx - 2},${mid - 13} l6,7 l-6,7 l6,7 c-6,-2 -7,3 -2,7`, fill: 'none', 'stroke-width': 2.2 }, g);
        else { // eighth / sixteenth rest: dot(s) with a slanted stem
          const n = k === 'eighth' ? 1 : 2;
          for (let r = 0; r < n; r++) {
            el('circle', { cx: cx - 3, cy: mid - 8 + r * 7, r: 2.2, stroke: 'none' }, g);
            el('path', { d: `M${cx - 3},${mid - 8 + r * 7} q4,0 6,-3`, fill: 'none', 'stroke-width': 1.5 }, g);
          }
          el('line', { x1: cx + 3, y1: mid - 11, x2: cx - 2 - (n - 1) * 1, y2: mid + 7 + (n - 1) * 7, 'stroke-width': 1.6 }, g);
        }
        if (e.dur.dots) el('circle', { cx: cx + 10, cy: mid - SP / 2, r: 1.8, stroke: 'none' }, g);
        return;
      }

      const cx = e.col.cx, bassStaff = staffOf(e) === 'bass';
      const yTop = yAtD(e, e.dTop), yBot = yAtD(e, e.dBot);
      // ledger lines
      const ledger = ly => el('line', { x1: cx - 10, x2: cx + 10, y1: ly, y2: ly, stroke: '#999', 'stroke-width': 1 }, g);
      if (!bassStaff) {
        for (let L2 = 28; L2 >= e.dBot; L2 -= 2) ledger(yTreble(L2));
        for (let L2 = 40; L2 <= e.dTop; L2 += 2) ledger(yTreble(L2));
      } else {
        for (let L2 = 16; L2 >= e.dBot; L2 -= 2) ledger(yBass(L2));
        for (let L2 = 28; L2 <= e.dTop; L2 += 2) ledger(yBass(L2));
      }
      const grp = groupOf.get(e);
      const down = grp ? grp.down : e.d >= midOf(e);
      // two neighbouring steps in a chord can't share a side of the stem: the second one is moved across
      const heads = e.heads, shifted = new Set();
      if (down) { for (let j = heads.length - 2; j >= 0; j--) if (heads[j + 1].d - heads[j].d === 1 && !shifted.has(j + 1)) shifted.add(j); }
      else { for (let j = 1; j < heads.length; j++) if (heads[j].d - heads[j - 1].d === 1 && !shifted.has(j - 1)) shifted.add(j); }
      const side = down ? -11.6 : 11.6;
      heads.filter(h => h.accidental).reverse().forEach((h, k) => {
        text(h.accidental, { x: cx - 19 - 11 * k, y: yAtD(e, h.d) + 5, 'font-size': 17, 'font-family': fontStack, stroke: 'none' }, g);
      });
      const open = e.dur.kind === 'half' || e.dur.kind === 'whole';
      const dotX = cx + 10 + (!down && shifted.size ? 11.6 : 0);
      heads.forEach((h, k) => {
        const hy = yAtD(e, h.d), hx = cx + (shifted.has(k) ? side : 0);
        el('ellipse', { cx: hx, cy: hy, rx: 6.2, ry: 4.6, transform: `rotate(-20 ${hx} ${hy})`, fill: open ? 'none' : 'currentColor', 'stroke-width': 1.6, 'data-head': k }, g);
        el('circle', { class: 'play-dot', cx: hx, cy: hy, r: 3, fill: '#ff9f1c', stroke: 'none', 'data-head': k }, g);
        el('circle', { class: 'sel-ring', 'data-head': k, cx: hx, cy: hy, r: 9, fill: 'none', stroke: '#4aa3ff', 'stroke-width': 1.5 }, g);
        if (e.dur.dots) el('circle', { cx: dotX, cy: h.d % 2 === 0 ? hy - SP / 2 : hy, r: 1.8, stroke: 'none' }, g);
      });
      if (e.dur.kind === 'whole') return;

      const sx = cx + (down ? -5.8 : 5.8);
      let tip;
      if (grp) {
        tip = down ? Math.max(...grp.map(m => yAtD(m, m.dBot))) + 3.5 * SP : Math.min(...grp.map(m => yAtD(m, m.dTop))) - 3.5 * SP;
      } else {
        tip = down ? yBot + 3.5 * SP : yTop - 3.5 * SP;
      }
      const stemFrom = down ? yTop : yBot;   // the stem starts at the head nearest its base
      el('line', { x1: sx, x2: sx, y1: stemFrom + (down ? 1 : -1), y2: tip, 'stroke-width': 1.4 }, g);
      e.sx = sx; e.tip = tip; e.down = down;
      if (!grp && flagged(e)) {
        const s = down ? -1 : 1;
        for (let n = 0; n < (e.dur.kind === 'sixteenth' ? 2 : 1); n++) {
          const y0 = tip + s * n * 6;
          el('path', { d: `M${sx},${y0} c0,${7 * s} 9,${9 * s} 7,${19 * s} c-1,${6 * s} -5,${8 * s} -7,${9 * s} z`, stroke: 'none' }, g);
        }
      }
    });

    // beams, second beams and triplet marks
    groups.forEach(g => {
      const tip = g[0].tip;
      if (g.length > 1) {
        const inward = g.down ? -1 : 1;           // beam sits inside the stem tip
        const x1 = g[0].sx - 0.7, x2 = g[g.length - 1].sx + 0.7;
        el('line', { x1, x2, y1: tip + inward * 2, y2: tip + inward * 2, 'stroke-width': 4 }, neutral);
        g.forEach((m, idx) => {
          if (m.dur.kind !== 'sixteenth') return;
          const nb = g[idx + 1] && g[idx + 1].dur.kind === 'sixteenth' ? g[idx + 1] : null;
          const yy = tip + inward * 8;
          if (nb) el('line', { x1: m.sx, x2: nb.sx, y1: yy, y2: yy, 'stroke-width': 3 }, neutral);
          else if (!(g[idx - 1] && g[idx - 1].dur.kind === 'sixteenth')) {
            const dir = idx === g.length - 1 ? -1 : 1;
            el('line', { x1: m.sx, x2: m.sx + dir * 7, y1: yy, y2: yy, 'stroke-width': 3 }, neutral);
          }
        });
      }
      if (g.some(m => m.dur.triplet)) {
        const mx = (g[0].sx + g[g.length - 1].sx) / 2;
        text('3', { x: mx, y: tip + (g.down ? 15 : -8), 'text-anchor': 'middle', 'font-size': 12, 'font-style': 'italic', fill: '#bbb', stroke: 'none', 'font-family': 'serif' }, neutral);
      }
    });

    scroller.appendChild(svg);
  }


  // Parses the comma format both pages use: "note:beats", "lyric:note:beats", a trailing "*N" repeat,
  // chords joined with "+", and [section] lines.
  function parseSequence(str) {
    const out = [];
    let pending = [];
    const flush = () => {
      if (!pending.length) return;
      pending.join(',').split(',').forEach(item => {
        item = item.trim();
        if (!item) return;
        let times = 1;
        const rm = /\*(\d+)$/.exec(item);
        if (rm) { times = Math.min(parseInt(rm[1], 10) || 1, 999); item = item.slice(0, rm.index).trim(); }
        const parts = item.split(':');
        let ev;
        if (parts.length >= 3) ev = { lyric: parts[0].trim(), note: parts[1].trim(), beats: parseFloat(parts[2]) || 1 };
        else if (parts.length === 2) ev = { note: parts[0].trim(), beats: parseFloat(parts[1]) || 1 };
        else ev = { note: item, beats: 1 };
        for (let k = 0; k < times; k++) out.push({ ...ev });
      });
      pending = [];
    };
    String(str || '').split('\n').map(l => l.trim()).filter(Boolean).forEach(line => {
      if (/^\[.+\]$/.test(line)) { flush(); out.push({ type: 'section', label: line.slice(1, -1), beats: 1 }); }
      else pending.push(line);
    });
    flush();
    return out;
  }

  // One staff display bound to a scroll container. render(treble, bass, { beatsPerBar, pickup }) draws it;
  // mark('treble'|'bass', i) puts the orange dot on that voice's note i (i < 0 clears) and scrolls to it.
  function create(config) {
    const scroller = config.scroller;
    let sel = null;   // { voice, i, head } — drawn in blue, with a ring on the chosen notehead
    injectStyle();
    function applySelection() {
      scroller.querySelectorAll('.staff-note.selected').forEach(n => n.classList.remove('selected'));
      scroller.querySelectorAll('.sel-ring.on').forEach(r => r.classList.remove('on'));
      if (!sel) return;
      const n = scroller.querySelector('.staff-note[data-voice="' + sel.voice + '"][data-i="' + sel.i + '"]');
      if (!n) return;
      n.classList.add('selected');
      n.querySelectorAll('.sel-ring').forEach(r => { if (sel.head == null || +r.getAttribute('data-head') === sel.head) r.classList.add('on'); });
      if (scroller.offsetParent !== null) {
        const x = +n.getAttribute('data-x');
        if (x < scroller.scrollLeft + 30 || x > scroller.scrollLeft + scroller.clientWidth - 30) {
          scroller.scrollTo({ left: Math.max(0, x - scroller.clientWidth / 2), behavior: 'smooth' });
        }
      }
    }
    return {
      render(treble, bass, settings) {
        render(scroller, treble || [], bass || [], { beatsPerBar: settings && settings.beatsPerBar, pickup: settings && settings.pickup, onNoteClick: config.onNoteClick });
        applySelection();
      },
      select(next) { sel = next || null; applySelection(); },
      mark(voice, i) {
        scroller.querySelectorAll('.staff-note[data-voice="' + voice + '"].playing').forEach(n => n.classList.remove('playing'));
        if (i < 0) return;
        const n = scroller.querySelector('.staff-note[data-voice="' + voice + '"][data-i="' + i + '"]');
        if (!n) return;
        n.classList.add('playing');
        if (scroller.offsetParent !== null) {
          scroller.scrollTo({ left: Math.max(0, +n.getAttribute('data-x') - scroller.clientWidth / 2), behavior: 'smooth' });
        }
      }
    };
  }

  // How full is the bar that holds item `index`? { bar, pickup, total, expected } in beats, or null when there are no bar lines.
  function barInfo(parsed, index, settings) {
    const bpbT = Math.round((parseFloat(settings && settings.beatsPerBar) || 0) * TICKS_PER_BEAT);
    if (!bpbT) return null;
    const pickupT = Math.min(Math.round((parseFloat(settings && settings.pickup) || 0) * TICKS_PER_BEAT), bpbT - 1);
    const shift = pickupT > 0 ? bpbT - pickupT : 0;
    let t = 0;
    const spans = parsed.map(item => {
      if (item && item.type === 'section') return null;
      const dt = toTicks(item && typeof item === 'object' ? (item.beats || 1) : 1);
      const span = { t, dt };
      t += dt;
      return span;
    });
    const me = spans[index];
    if (!me) return null;
    const bar = Math.floor((me.t + shift) / bpbT);
    let total = 0;
    spans.forEach(sp => { if (sp && Math.floor((sp.t + shift) / bpbT) === bar) total += sp.dt; });
    const isPickup = pickupT > 0 && bar === 0;
    return { bar: pickupT > 0 ? bar : bar + 1, pickup: isPickup, total: total / TICKS_PER_BEAT, expected: (isPickup ? pickupT : bpbT) / TICKS_PER_BEAT };
  }

  global.StaffView = { TICKS_PER_BEAT, toTicks, parseSequence, barInfo, create };
})(window);
