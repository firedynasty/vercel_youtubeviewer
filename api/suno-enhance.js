import { timingSafeEqual } from 'node:crypto';

// Send a rendered piano piece (mp3) to Suno via muapi as an instrumental remix, then poll the job.
//   POST { audio: "data:audio/mpeg;base64,...", style, title, weight }  -> { request_id }
//   GET  ?id=<request_id>                                               -> { state, tracks, error }
// Same endpoints and response shapes as the working create_songs/remix.py.
const BASE_URL = 'https://api.muapi.ai/api/v1';
const MAX_AUDIO_BYTES = 8 * 1024 * 1024; // muapi's upload limit is 10 MB

// Each POST is a paid Suno job, so every call needs the shared ACCESS_CODE. Fails closed if unset.
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

// Finished-job output is a list of urls or {audio_url|url} objects; older shape has a top-level audio_url
function extractTracks(status) {
  const out = Array.isArray(status.outputs) ? status.outputs : [];
  const urls = out
    .map((o) => (typeof o === 'string' ? o : o && (o.audio_url || o.url)))
    .filter((u) => typeof u === 'string' && /^https?:\/\//.test(u));
  if (!urls.length && typeof status.audio_url === 'string') urls.push(status.audio_url);
  return urls;
}

async function startJob(req, res, apiKey) {
  const { audio, style, title, weight } = req.body || {};
  const m = typeof audio === 'string' && /^data:audio\/[\w.+-]+;base64,/.exec(audio);
  if (!m) return res.status(400).json({ error: 'Expected "audio" as a data:audio/...;base64 URL' });
  const bytes = Buffer.from(audio.slice(m[0].length), 'base64');
  if (!bytes.length || bytes.length > MAX_AUDIO_BYTES) {
    return res.status(400).json({ error: `Audio must be between 1 byte and ${MAX_AUDIO_BYTES / 1024 / 1024} MB` });
  }

  const headers = { 'x-api-key': apiKey };

  // 1. Upload to get a URL the remix endpoint can read
  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'audio/mpeg' }), 'piano.mp3');
  const up = await fetch(`${BASE_URL}/upload_file`, { method: 'POST', headers, body: form });
  const upJson = await up.json().catch(() => ({}));
  const audioUrl = upJson.url || upJson.file_url || upJson.audio_url;
  if (!up.ok || !audioUrl) {
    return res.status(502).json({ error: 'Suno upload failed', detail: upJson });
  }

  // 2. Start the remix (instrumental: keep the melody, re-arrange it)
  const payload = {
    prompt: '[instrumental]',
    audio_url: audioUrl,
    style: String(style || 'cinematic orchestral arrangement of a piano piece, strings, soft pad, gentle drums, keeps the melody').slice(0, 1000),
    title: String(title || 'Piano piece').slice(0, 80),
    custom_mode: true,
    instrumental: true
  };
  const w = Number(weight);
  if (Number.isFinite(w) && w >= 0 && w <= 1) payload.audio_weight = w;

  const r = await fetch(`${BASE_URL}/suno-remix-music`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const rJson = await r.json().catch(() => ({}));
  if (!r.ok || !rJson.request_id) {
    return res.status(502).json({ error: 'Suno remix request failed', detail: rJson });
  }
  return res.status(200).json({ request_id: rJson.request_id });
}

async function checkJob(req, res, apiKey) {
  const id = String(req.query.id || '');
  if (!/^[\w-]{6,80}$/.test(id)) return res.status(400).json({ error: 'Missing or invalid id' });

  const poll = await fetch(`${BASE_URL}/predictions/${id}/result`, { headers: { 'x-api-key': apiKey } });
  const status = await poll.json().catch(() => ({}));
  if (!poll.ok) {
    // muapi reports a failed job as HTTP 400 with {"detail":{"status":"failed","error":"..."}}
    const d = status.detail && typeof status.detail === 'object' ? status.detail : status;
    if (d.status === 'failed' || d.status === 'error' || d.error) {
      return res.status(200).json({ state: 'error', error: `Suno rejected it: ${String(d.error || 'job failed')}` });
    }
    return res.status(502).json({ error: `Suno status check failed (${poll.status})`, detail: status });
  }
  const state = status.status;
  if (state === 'failed' || state === 'error' || status.error) {
    return res.status(200).json({ state: 'error', error: String(status.error || 'Suno job failed') });
  }
  if (['processing', 'queued', 'pending'].includes(state) || !state) {
    return res.status(200).json({ state: 'running' });
  }
  const tracks = extractTracks(status);
  if (!tracks.length) return res.status(200).json({ state: 'error', error: 'Finished but no audio url found', detail: status });
  return res.status(200).json({ state: 'completed', tracks });
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!checkAccessCode(req, res)) return;

  const apiKey = process.env.MUAPI_KEY;
  if (!apiKey) return res.status(500).json({ error: 'MUAPI_KEY not configured' });

  try {
    return req.method === 'POST' ? await startJob(req, res, apiKey) : await checkJob(req, res, apiKey);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
