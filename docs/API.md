# Cloud AOS public API, version 1

Read-only access to a company's data for other systems: a head-office report, a BI tool, a bank or
BIR integration. Every answer comes from the same rules as the Cloud AOS screens.

Base address: `https://<your Cloud AOS server>/api/v1`

## Getting a key

An administrator creates a key in **Administration → System → API Keys**:

* the key belongs to the company the administrator is signed in to;
* it reads with the rights of the user group chosen for it (Internal Audit is a good default: it can
  see but not change), so the Access Matrix decides what it may read;
* it is shown **once**. Store it like a password. If it is lost or leaked, revoke it and create a
  new one; a revoked key stops working at once.

Send it with every request:

```
Authorization: Bearer caos_8300_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

(`X-API-Key: caos_…` works too.)

## Resources

| Method and path | Returns |
| :--- | :--- |
| `GET /api/v1` | What this key can read |
| `GET /api/v1/company` | The key's company: business area and name |
| `GET /api/v1/customers` · `/vendors` · `/materials` · `/plants` · `/accounts` · `/cost-centers` · `/profit-centers` · `/salesmen` | Master data lists (paged) |
| `GET /api/v1/customers/{custno}` (same for each list) | One record |
| `GET /api/v1/documents` | The document types (`so`, `si`, `or`, `po`, `vp`, `cv`, `jv`, …) |
| `GET /api/v1/documents/{type}?from=YYYY-MM-DD&to=YYYY-MM-DD&status=…&q=…` | Documents of one type (paged) |
| `GET /api/v1/documents/{type}/{no}` | One document: header, lines, totals, links |
| `GET /api/v1/reports/trial-balance?as_of=YYYY-MM-DD` | Trial balance |
| `GET /api/v1/reports/financial-statements?year=2026&month=9` | Balance sheet and income statement |
| `GET /api/v1/reports/ar-aging?as_of=…` · `/reports/ap-aging?as_of=…` | Receivables and payables aging |
| `GET /api/v1/stock` | Stock by plant |
| `GET /api/v1/jobs/{id}` | Status of a background job started by the same caller |

## Pagination

Every list takes `limit` (1–200, default 50) and `cursor`:

```
GET /api/v1/customers?limit=50
```

```json
{
  "data": [ { "custno": "C00001", "bussname": "…" } ],
  "page": { "limit": 50, "has_more": true, "next_cursor": "bzo1MA", "total": 312 }
}
```

Ask for the next page with `?cursor=<next_cursor>`, or follow the `Link: <…>; rel="next"` header,
until `has_more` is `false`. Treat the cursor as an opaque value.

## Errors

Every error has the same shape, and the `request_id` is also in the `X-Request-Id` header. Quote it
when you report a problem; the server log has the details.

```json
{ "error": { "code": "forbidden", "message": "Your user group (LAB) is not allowed to view …", "request_id": "req_Ab12…" } }
```

| Status | `code` | Meaning |
| :--- | :--- | :--- |
| 400 | `bad_request` | A parameter is not valid (e.g. a cursor) |
| 401 | `unauthorized` | Missing, wrong or revoked key |
| 403 | `forbidden` | The key's user group may not read this |
| 404 | `not_found` | No such resource or record |
| 405 | — | Not GET: version 1 is read-only |
| 413 | `too_large` | The request body is over the size limit |
| 429 | `rate_limited` | Over 300 requests a minute for this key; wait `Retry-After` seconds |
| 503 | `unavailable` | The company is under maintenance, or its database cannot be reached |
| 504 | `timeout` | The database took too long; narrow the dates and try again |
| 500 | `server_error` | Unexpected; quote the `request_id` |

## Limits and headers

* 300 requests a minute per key. Every answer carries `X-RateLimit-Limit` and `X-RateLimit-Remaining`.
* Every answer carries `API-Version: 1`.
* Every answer carries an `ETag`. Send it back as `If-None-Match` and you get
  `304 Not Modified` with no body when nothing changed, so a dashboard that refreshes every minute
  downloads the data only when it is new. Answers are `Cache-Control: private, no-cache`: your
  program may keep a copy but must ask each time; shared proxies never keep one.
* The server keeps recent answers for a few seconds, so a dashboard that refreshes often stays fast.
* Calling from a web page in a browser needs the page's origin in `API_CORS_ORIGINS` on the server.

## Versioning

The path carries the version. Within v1, fields may be **added** but are never removed or renamed.
A change that would break a caller becomes `/api/v2`, and v1 stays available until its callers
have moved.

## Examples

```bash
KEY="caos_8300_…"
curl -H "Authorization: Bearer $KEY" https://cloudaos.example/api/v1/company
curl -H "Authorization: Bearer $KEY" "https://cloudaos.example/api/v1/documents/si?from=2026-10-01&to=2026-10-31&limit=100"
curl -H "Authorization: Bearer $KEY" "https://cloudaos.example/api/v1/reports/trial-balance?as_of=2026-10-31"
```

```js
// Every customer, page by page (Node.js 18+).
let url = 'https://cloudaos.example/api/v1/customers?limit=200';
const all = [];
while (url) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.CAOS_KEY}` } });
  const body = await res.json();
  if (!res.ok) throw new Error(`${body.error.code}: ${body.error.message} (${body.error.request_id})`);
  all.push(...body.data);
  url = body.page.has_more ? `https://cloudaos.example/api/v1/customers?limit=200&cursor=${body.page.next_cursor}` : null;
}
```
