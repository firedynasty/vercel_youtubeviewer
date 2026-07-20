// famous-beats-presets.js
// Edit this file to add, remove, or tweak presets.
// Paste exported objects from the beat maker directly into the array below.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
  var STEPS = 16;

  function pattern(steps) {
    var arr = new Array(STEPS).fill(0);
    steps.forEach(function (s) { arr[s] = 1; });
    return arr;
  }

  window.FAMOUS_BEATS_PRESETS = [
    {
      name: "Four-on-the-floor (house)",
      bpm: 124,
      desc: "Steady kick on every beat with off-beat hi-hats — the backbone of house and disco.",
      kick: pattern([0,4,8,12]),
      snare: pattern([4,12]),
      hat: pattern([2,6,10,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Boom-bap (hip-hop)",
      bpm: 92,
      desc: "Kick up front, snare on 2 and 4, hi-hats filling the gaps — the classic '90s hip-hop feel.",
      kick: pattern([0,10]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: '"We Will Rock You" stomp',
      bpm: 81,
      desc: "Stomp-stomp-clap, repeated — two kicks then a snare hit, in groups of four steps.",
      kick: pattern([0,1,4,5,8,9,12,13]),
      snare: pattern([2,6,10,14]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Son clave (3-2)",
      bpm: 100,
      desc: "The clave pattern underpinning Afro-Cuban and Bo Diddley-style rhythms — three hits, then two.",
      kick: pattern([0,3,6,10,12]),
      snare: pattern([]),
      hat: pattern([2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Habanera / tresillo",
      bpm: 96,
      desc: "Long-short-short-long grouping — the tresillo feel behind habanera, tango, and countless Latin styles.",
      kick: pattern([0,3,6,8,11,14]),
      snare: pattern([]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Funk break (syncopated)",
      bpm: 106,
      desc: "Syncopated kick, ghost-note snares, and busy hats — a break-beat style pattern.",
      kick: pattern([0,6,10]),
      snare: pattern([4,9,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Boom-bap No. 2 (head-nod)",
      bpm: 88,
      desc: "A laid-back variation — kick on the '1' and the 'and' of 2, snare on 2 and 4, steady 8th-note hats. Good pocket for a relaxed flow.",
      kick: pattern([0,6,8]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Boom-bap (clave shift)",
      bpm: 90,
      desc: "Kick follows a son-clave-style 3-then-2 shape — busier and syncopated in the first half of the bar, then settling into a straighter pattern for the second half. Snare and hats stay in a standard boom-bap backbeat, so you get that same 'the beat changes underneath you' feeling clave has, inside one loop.",
      kick: pattern([0,3,6,8,10]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Trap (hi-hat rolls)",
      bpm: 140,
      desc: "Half-time snare feel with fast rolling hi-hats — the modern trap template. BPM reads double-time, so it feels like 70 for rapping.",
      kick: pattern([0,3,8,10,14]),
      snare: pattern([8]),
      hat: pattern([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Drill (sliding 808 feel)",
      bpm: 142,
      desc: "Syncopated, triplet-leaning kicks with a sparse snare on the back half — the UK/Chicago drill pocket. Also reads half-time.",
      kick: pattern([0,3,7,10,13]),
      snare: pattern([8]),
      hat: pattern([0,3,6,8,11,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Old-school breakbeat",
      bpm: 96,
      desc: "A classic sampled-break feel — syncopated kick, crisp snare on 2 and 4, straight 8th hats. The foundation of golden-era boom bap.",
      kick: pattern([0,5,10]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Lo-fi chill hip-hop",
      bpm: 82,
      desc: "Loose, swung feel with a soft kick, brushed snare on 2 and 4, and sparse hats — good for a slower, conversational flow.",
      kick: pattern([0,7,10]),
      snare: pattern([4,12]),
      hat: pattern([0,4,8,12]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Lo-fi (four-and-pause hats)",
      bpm: 80,
      desc: "Hi-hats fire four quick beeps, then rest, then four more — a breathing, call-and-response hat pattern over a soft kick/snare.",
      kick: pattern([0,10]),
      snare: pattern([4,12]),
      hat: pattern([0,1,2,3,8,9,10,11]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Lo-fi dusty (sparse & swung)",
      bpm: 76,
      desc: "Minimal and unhurried — just kick, snare, and a light hat accent, leaving lots of open space for vocals.",
      kick: pattern([0,9]),
      snare: pattern([4,12]),
      hat: pattern([2,6,10,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Rock-flip (verse)",
      bpm: 120,
      desc: "Straight 8th-note hi-hats, kick on beats 1 and 3, snare also on 1 and 3 — the 'flipped' verse feel before it resolves to a normal backbeat in the chorus.",
      kick: pattern([0,8]),
      snare: pattern([0,8]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Rock-flip (chorus)",
      bpm: 120,
      desc: "Same 8th-note hi-hat and kick as the verse, but the snare moves to the standard 2 & 4 backbeat — the payoff shift into the chorus.",
      kick: pattern([0,8]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: '"Billie Jean"-style groove',
      bpm: 117,
      desc: "An early-'80s disco-pop pocket — kick on the 1 and the '&' of 2, snare locked on 2 & 4, steady 8th-note hats. Captures the general feel, not a transcription of the actual recording.",
      kick: pattern([0,6]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: "Lo-fi jazzy (brushed & syncopated)",
      bpm: 84,
      desc: "A loose, jazz-inflected pocket — kick lands off the beat, snare stays put, hats swing in triplet-ish pairs.",
      kick: pattern([0,6,11]),
      snare: pattern([4,12]),
      hat: pattern([0,3,6,9,12,15]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: '"Air on the G String" (rock drums)',
      bpm: 66,
      desc: "A rock-drum treatment of Bach's famously steady, walking-bass pulse — kick and a 'doot doot doot doot' quarter-note tone line hold down the beat, snare adds a rock backbeat, hi-hats fill in 8ths. Just the pulse, not the actual melody.",
      kick: pattern([0,4,8,12]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([0,4,8,12])
    },
    {
      name: "Beethoven 5th motif rhythm",
      bpm: 108,
      desc: "Short-short-short-LONG — just the rhythmic shape of the famous opening motto, on a single tone.",
      kick: pattern([]),
      snare: pattern([]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([0,2,4,8])
    },
    {
      name: '"Winter" (Vivaldi, modern drums)',
      bpm: 116,
      desc: "A modern-drum take on Vivaldi's Winter — steady 'bomp bomp bomp bomp' kick quarter-notes and sparse hats for the first half, then the hats roll into a fast, shivering 16th-note texture and the snare crashes in for the second half as it 'gets more serious.'",
      kick: pattern([0,4,8,12]),
      snare: pattern([12]),
      hat: pattern([2,6,8,9,10,11,12,13,14,15]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: '"Smooth Criminal"-style groove',
      bpm: 118,
      desc: "Jonathan Moffett's driving pocket for Michael Jackson's 'Smooth Criminal' — syncopated kick, tight snare backbeat, fast 16th-note hats, and a steady 8th-note 'da da dun dun da da dun dun' bass-riff pulse on the tone track. Captures the drive, not a transcription of the actual recording.",
      kick: pattern([0,6,8,14]),
      snare: pattern([4,12]),
      hat: pattern([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]),
      crash: pattern([]),
      tone: pattern([0,2,4,6,8,10,12,14])
    },
    {
      name: '"Ride of the Valkyries" (Wagner) — the gallop enters',
      bpm: 108,
      desc: "A sparse opening build — echoing the few stanzas before the famous motif arrives — then the galloping 'ba ba ba BUM, ba ba ba BUM' kicks in: hi-hats gallop in fast 16ths, kick/snare land the accented BUM, crash marks the full entrance.",
      kick: pattern([0,4,11,15]),
      snare: pattern([11,15]),
      hat: pattern([8,9,10,12,13,14]),
      crash: pattern([15]),
      tone: pattern([0,4])
    },
    {
      name: '"Ride of the Valkyries" (Wagner) — the entrance explodes',
      bpm: 112,
      desc: "Captures the shift: a sparse, atmospheric first half with almost nothing playing, then a crash marks the turn and the drums explode in — building kick/snare hits filling out the second half of the bar, echoing that famous entrance.",
      kick: pattern([8,10,12,13,14,15]),
      snare: pattern([9,11,13,15]),
      hat: pattern([]),
      crash: pattern([8]),
      tone: pattern([0])
    },
    {
      name: '"Another One Bites the Dust" (Queen)-style groove',
      bpm: 110,
      desc: "The iconic bass-riff rhythm — 'da da dun dun dun, da da dun dun dun' on the tone track, over a steady kick pulse, backbeat snare, and straight 8th-note hats.",
      kick: pattern([0,4,8,12]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([0,2,4,5,6,8,10,12,13,14])
    },
    {
      name: '"Also Sprach Zarathustra" (Strauss) opening',
      bpm: 60,
      desc: "The famous sunrise fanfare's anticipation build — a long sustained low tone, then three ascending notes spaced further apart as tension builds, resolving into a massive hit with a rolling timpani tail. Captures the rhythmic shape of the build and payoff, not the actual melody.",
      kick: pattern([12,13,14,15]),
      snare: pattern([]),
      hat: pattern([]),
      crash: pattern([12]),
      tone: pattern([0,6,8,10])
    },
    {
      name: '"Boléro" (Ravel) walking snare',
      bpm: 72,
      desc: "The hypnotic snare ostinato that repeats, unchanged, underneath the entire piece — a steady walking pulse anchored by the kick, building tension through repetition rather than rhythmic variation. Approximated for this 4/4 grid, not an exact transcription of the original 3/4 pattern.",
      kick: pattern([0,8]),
      snare: pattern([0,2,4,6,8,10,12,14]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([])
    },
    {
      name: '"Toccata and Fugue in D minor" (Bach)',
      bpm: 76,
      desc: "The dramatic opening flourish, rhythm-only — a rapid descending run followed by a held, weighty landing note, then space before it happens again.",
      kick: pattern([]),
      snare: pattern([]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([0,1,2,3,4,5,8])
    },
    {
      name: "Sunday Porch (acoustic R&B)",
      bpm: 92,
      desc: "Warm, playful sway — the kind of two-chord loop you hum over on a good day.",
      kick: pattern([0,6,8]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([10,14])
    },
    {
      name: "Skip in the Step (acoustic R&B)",
      bpm: 100,
      desc: "Upbeat and bouncy with a hop in the kick — invites an ad-lib on every offbeat.",
      kick: pattern([0,3,8,10]),
      snare: pattern([4,12]),
      hat: pattern([2,6,10,14]),
      crash: pattern([]),
      tone: pattern([0,7,15])
    },
    {
      name: "Window Seat (acoustic R&B)",
      bpm: 78,
      desc: "Reflective and unhurried — wide space between hits so a lyric can sit in the pocket.",
      kick: pattern([0,10]),
      snare: pattern([4,12]),
      hat: pattern([0,4,8,12]),
      crash: pattern([]),
      tone: pattern([6,14])
    },
    {
      name: "Golden Hour (acoustic R&B)",
      bpm: 88,
      desc: "Tender but forward-moving — reflective verses that can open up into a singable hook.",
      kick: pattern([0,6,8,12]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([2,10])
    },
    {
      name: "Piano Center (worship)",
      bpm: 72,
      desc: "Still and intimate — just a heartbeat kick and a soft cross-stick so the piano carries everything.",
      kick: pattern([0,8]),
      snare: pattern([4,12]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([2,6,10,14])
    },
    {
      name: "Sacred Space (worship)",
      bpm: 68,
      desc: "Barely-there pulse for a reflective verse — leaves wide room around the vocal and the keys.",
      kick: pattern([0,10]),
      snare: pattern([8]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([0,4,8,12])
    },
    {
      name: "Gentle Sway (worship)",
      bpm: 76,
      desc: "Soft 6/8 lilt approximated on the grid — a rocking, hymn-like feel to sit and dwell in.",
      kick: pattern([0,6,8,14]),
      snare: pattern([4,12]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([0,3,6,8,11,14])
    },
    {
      name: "Quiet Surrender (worship)",
      bpm: 66,
      desc: "The stripped bridge moment — almost no drums, piano and voice alone before it opens back up.",
      kick: pattern([0]),
      snare: pattern([]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([0,8])
    },
    {
      name: "Bethany (Lowell Mason)",
      bpm: 63,
      desc: "'Nearer, My God, to Thee' — Mason's gentle 6/8 tune, approximated as a slow rocking lilt for a reflective hymn.",
      kick: pattern([0,6,8,14]),
      snare: pattern([]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([0,3,6,8,11,14])
    },
    {
      name: "Hamburg (Lowell Mason)",
      bpm: 60,
      desc: "'When I Survey the Wondrous Cross' — a slow, meditative communion hymn; heartbeat kick and sustained piano only.",
      kick: pattern([0,8]),
      snare: pattern([]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([0,4,8,12])
    },
    {
      name: "Olivet (Lowell Mason)",
      bpm: 70,
      desc: "'My Faith Looks Up to Thee' — a tender profession of faith; soft cross-stick and gentle keys.",
      kick: pattern([0,8]),
      snare: pattern([4,12]),
      hat: pattern([]),
      crash: pattern([]),
      tone: pattern([2,6,10,14])
    },
    {
      name: "Azmon (Lowell Mason)",
      bpm: 92,
      desc: "'O for a Thousand Tongues to Sing' — Mason's brighter praise tune, opened up a little for a lifted, joyful feel.",
      kick: pattern([0,6,8,12]),
      snare: pattern([4,12]),
      hat: pattern([0,4,8,12]),
      crash: pattern([]),
      tone: pattern([0,8])
    },
    {
      name: "Antioch (Lowell Mason)",
      bpm: 100,
      desc: "'Joy to the World' — Mason's arrangement after Handel; majestic and forward-moving for a full, glad sound.",
      kick: pattern([0,4,8,12]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([0])
    },
    {
      name: "Menu Trap (NBA 2K)",
      bpm: 140,
      desc: "Half-time trap in the classic 2K menu mold — booming kick, hard clap on 3, hats implying the rolls.",
      kick: pattern([0,6,10]),
      snare: pattern([8]),
      hat: pattern([0,2,4,6,8,10,12,13,14,15]),
      crash: pattern([0]),
      tone: pattern([])
    },
    {
      name: "Boom Bap Court (NBA 2K)",
      bpm: 90,
      desc: "Head-nod boom-bap — dusty kick-snare with a swung hat for that old-school hoop-intro feel.",
      kick: pattern([0,3,8]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([7,15])
    },
    {
      name: "Hype Anthem (NBA 2K)",
      bpm: 150,
      desc: "High-energy stadium hip-hop — driving kick and a big backbeat to get the arena on its feet.",
      kick: pattern([0,4,8,10,12]),
      snare: pattern([4,12]),
      hat: pattern([2,6,10,14]),
      crash: pattern([0]),
      tone: pattern([])
    },
    {
      name: "Drip Bounce (NBA 2K)",
      bpm: 130,
      desc: "Modern melodic trap bounce — syncopated kick and triplet hat flavor under a catchy hook.",
      kick: pattern([0,3,6,10,11]),
      snare: pattern([8]),
      hat: pattern([0,2,4,5,8,10,12,14]),
      crash: pattern([0]),
      tone: pattern([0,12])
    },
    {
      name: "West Coast Roll (NBA 2K)",
      bpm: 96,
      desc: "G-funk lean — laid-back bounce with a swung backbeat, the kind of ride-out groove between quarters.",
      kick: pattern([0,6,8,14]),
      snare: pattern([4,12]),
      hat: pattern([0,3,4,6,8,11,12,14]),
      crash: pattern([]),
      tone: pattern([2,10])
    },
    {
      name: "Pump Up Rock (NBA 2K)",
      bpm: 128,
      desc: "Arena rock-rap crossover — four-on-the-floor drive and crashes for the highlight-reel montage energy.",
      kick: pattern([0,4,8,12]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([0,8]),
      tone: pattern([])
    },
    {
      name: "Lofi Focus",
      bpm: 78,
      desc: "Dusty boom-bap swing with a lazy late kick and constant soft hats to hold a smooth flow state, ultimate focus lofi hip hop.",
      kick: pattern([0,6,10]),
      snare: pattern([4,12]),
      hat: pattern([0,2,4,6,8,10,12,14]),
      crash: pattern([]),
      tone: pattern([2,11])
    },
    {
      name: "Neon Outrun",
      bpm: 116,
      desc: "Driving 80s synthwave pulse — relentless downbeat kick and offbeat hats pushing forward like a neon highway.",
      kick: pattern([0,4,8,12]),
      snare: pattern([4,12]),
      hat: pattern([2,6,10,14]),
      crash: pattern([]),
      tone: pattern([0,3,6,8,11,14])
    },
    {
      name: "Chillwave Haze",
      bpm: 92,
      desc: "Dreamy half-time chillwave — soft backbeat and sparse hats for a hazy, unhurried background.",
      kick: pattern([0,10]),
      snare: pattern([4,12]),
      hat: pattern([0,4,8,12]),
      crash: pattern([]),
      tone: pattern([2,6,10,14])
    },
    {
      name: "Netrunner Drone",
      bpm: 100,
      desc: "Minimalist sci-fi ambience — one deep pulse, no backbeat, glitchy metallic hats over a dark sub drone.",
      kick: pattern([0]),
      snare: pattern([]),
      hat: pattern([2,7,10,15]),
      crash: pattern([]),
      tone: pattern([0,5,8])
    },
    {
      name: "Deep House Flow",
      bpm: 123,
      desc: "Hypnotic four-on-the-floor with offbeat open hats — the classic house signature to lock into a fast typing rhythm.",
      kick: pattern([0,4,8,12]),
      snare: pattern([4,12]),
      hat: pattern([2,6,10,14]),
      crash: pattern([]),
      tone: pattern([0,3,6,10,13])
    },
    {
      name: "Liquid Roller",
      bpm: 174,
      desc: "Real liquid drum & bass — the signature two-step break (kick, snare, kick, snare) rolling fast and smooth.",
      kick: pattern([0,10]),
      snare: pattern([4,12]),
      hat: pattern([2,6,8,10,14,15]),
      crash: pattern([]),
      tone: pattern([0,8])
    },

    // ── Paste exported presets below this line ────────────────────────────────

  ];
})();
