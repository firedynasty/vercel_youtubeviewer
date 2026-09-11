# API Contract: /api/playlists

## Endpoint

```
GET /api/playlists
```

Proxies the URL stored in the `DROPBOX_PLAYLISTS_URL` Vercel environment variable and returns
the raw JSON response. Identical pattern to `/api/paths.js` in the clipboard manager project.

---

## Request

No request body. No query parameters required.

Optional override (for local dev without env var set):
```
GET /api/playlists?url=https://www.dropbox.com/s/xxx/playlists.json?dl=1
```

---

## Success Response

**Status**: `200 OK`
**Content-Type**: `application/json`
**Cache-Control**: `s-maxage=60, stale-while-revalidate=300`
**Access-Control-Allow-Origin**: `*`

**Body**: PlaylistMap — see `data-model.md` for full schema.

---

## Error Responses

| Condition | Status | Body |
|-----------|--------|------|
| `DROPBOX_PLAYLISTS_URL` not set and no `?url=` param | 400 | `{"error":"Missing ?url= parameter or DROPBOX_PLAYLISTS_URL env var"}` |
| Upstream Dropbox fetch returns non-2xx | upstream status | `{"error":"Upstream error {status}"}` |
| Upstream response is not valid JSON | 500 | `{"error":"...parse error message..."}` |
| Network / timeout error | 500 | `{"error":"...error message..."}` |

---

## Environment Variable

| Variable | Required | Description |
|----------|----------|-------------|
| `DROPBOX_PLAYLISTS_URL` | Yes (in production) | Raw Dropbox share link to `playlists.json`. Use `?dl=1` suffix or a `dl.dropboxusercontent.com` direct link. |

**Set via**:
```bash
vercel env add DROPBOX_PLAYLISTS_URL
# paste the Dropbox URL when prompted
```

---

## Implementation Notes

- Use `fetch(url, { redirect: 'follow' })` — Dropbox may issue 301/302 redirects.
- The function is a thin proxy; it MUST NOT transform or filter the JSON.
- Response body is passed through as-is from the upstream JSON parse.
