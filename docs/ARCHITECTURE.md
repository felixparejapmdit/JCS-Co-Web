# Cloud AOS architecture

A guide for programmers who maintain or extend Cloud AOS: how a request travels, where each kind of
code lives, and the rules that keep the system fast and correct. The product and the legacy system
are described in [PLAN.md](../PLAN.md); the public API is documented in [API.md](API.md).

## 1. The layers

```
Browser (screens)                       Another system (BI tool, head-office report, bank, BIR)
   │  POST /api/aos {op, args}             │  GET /api/v1/... + Authorization: Bearer caos_...
   ▼                                       ▼
┌──────────────────────────── API gateway (server/platform/gateway.ts) ────────────────────────────┐
│ request id · error envelope · rate limits · security headers · access log                        │
└───────────────────────────────────────────────────────────────────────────────────────────────────┘
   │                                       │
   ▼                                       ▼
Internal API = BFF                       Public API v1 (server/api/v1/router.ts)
app/api/aos/route.ts                     resources · pagination · versioning · API keys
  sessions · idempotency                   │  calls the same operations as the screens
   │                                       │
   └──────────────► runOp (server/rpc.ts) ◄┘   operation registry: maintenance guard,
                         │                     read cache, cache invalidation after saves
                         ▼
                  Services (server/services/*)   business rules per module, legacy rights
                         │
                         ▼
                  Db interface (server/db)       MemoryDb (sample data) │ MysqlDb (client databases)
                         │
                         ▼
                  Legacy tables (jcs / apf / chemag) + additive ng_* tables
```

Each layer has one job. A rule of thumb when adding code:

| You are adding… | Put it in |
| :--- | :--- |
| A business rule (posting, VAT, a check before saving) | `src/server/services/<module>.ts` |
| A new screen's data | an operation in `src/server/rpc.ts` that calls services; list it in `src/shared/ops.ts` if it only reads |
| Something an outside system needs to read | a resource in `src/server/api/v1/router.ts` that calls an existing operation |
| A cross-cutting concern (limits, caching, jobs, headers) | `src/server/platform/` |
| Database access | the `Db` interface only (`all`, `one`, `insert`, `update`, `remove`, `tx`); never SQL in a service |

## 2. Folder map

```
src/app/                     Next.js pages (App Router) and API routes
  api/aos/route.ts           internal API (BFF): sessions, rate limits, idempotency
  api/v1/[[...path]]/route.ts public API v1 → server/api/v1/router.ts
  api/healthz/route.ts       health check (load balancers, monitoring)
  dashboard/…                the screens
src/components/              UI: shell (side menu, header), doc framework, reports, UI kit
src/lib/api.ts               browser side of the internal API: rpc(), useRpc() screen cache
src/server/
  platform/                  cross-cutting: gateway, store (Redis/memory), read cache,
                             idempotency, rate limits, async jobs
  api/v1/                    public API: routes, pagination, versioning
  rpc.ts                     operation registry (the BFF's operations) and runOp
  services/                  business rules per module, on the legacy tables
  db/                        Db interface; MemoryDb, MysqlDb; data source; sample loader
  seed/                      sample companies and their transaction history
  auth.ts                    session cookie, legacy and Argon2id passwords
src/shared/                  code used by both browser and server: ops list, dates, money, codes, brands
database/mysql/              ng_* table migrations (run in each company database)
docs/                        this guide and the API reference
tests/server/, e2e/          server tests (Vitest) and browser tests (Playwright)
```

## 3. How a request travels

**A screen loads its data** (`useRpc('doc.list', {type: 'si'})`):

1. `lib/api.ts` answers from the screen cache if it has the answer, then asks the server.
2. The gateway gives the request an id and a rate-limit check; `api/aos/route.ts` reads the session.
3. `runOp` checks maintenance mode, then, for a read against MySQL, looks in the read cache.
4. On a miss, the operation calls the service, the service reads through the `Db` interface, and
   the answer is cached for a few seconds.

**A screen saves** (`rpc('doc.save', …)`):

1. The browser sends an `Idempotency-Key`; the same save asked twice while it runs is sent once.
2. The route runs it once per key; a repeat of the same key gets the stored answer.
3. After the save, `runOp` bumps the company's cache generation: every cached read of that company
   is stale at once, so the user sees the change on the next screen.

## 4. The API design patterns, and where each lives

| Pattern | In Cloud AOS | Where |
| :--- | :--- | :--- |
| **Resource design** | The public API names things, not actions: `/customers`, `/documents/si/{no}`, `/reports/trial-balance`. GET only in v1. | `server/api/v1/router.ts` |
| **Idempotency** | Every save carries an `Idempotency-Key` (browser); the server runs a key once and replays the answer for 24 h. Failed requests can be retried with the same key. | `lib/api.ts`, `server/platform/idempotency.ts`, `api/aos/route.ts` |
| **Pagination** | Every public list: `?limit` (1–200) and an opaque `?cursor`; answers `{data, page}` and a `Link: rel="next"` header. | `pageOf` in `server/api/v1/router.ts` |
| **Async APIs** | Work longer than a request (loading the sample data, ~20 s) starts as a job and answers at once with its id; the caller asks `jobs.get` / `GET /api/v1/jobs/{id}` until it is done. | `server/platform/jobs.ts`, `services/datasource.ts` |
| **Versioning** | `/api/v1` in the path and an `API-Version` header. A breaking change becomes `/api/v2`; v1 keeps working until its users have moved. The internal API is not versioned: it ships with the screens that call it. | `server/api/v1/router.ts` |
| **BFF** (backend for frontend) | The internal API is shaped like the screens (`home.dashboard`, `doc.list`), so a screen needs one round trip. It can change with the screens; outside systems use the public API, which stays stable. | `server/rpc.ts`, `api/aos/route.ts` |
| **API gateway** | One layer in front of every API: request ids, one error format, rate limits, security headers, access logs. | `server/platform/gateway.ts` |

## 5. Caching (Redis)

All platform features share one key/value store (`server/platform/store.ts`):

* `REDIS_URL` set: **Redis**, shared by every server instance. If Redis stops answering, the store
  keeps working from memory and logs it once; the application never stops because of the cache.
* `REDIS_URL` empty: memory of the server process (development, one server, tests).

What is cached, and why it stays correct:

| Cache | Lives in | Rule |
| :--- | :--- | :--- |
| Screen cache | browser | A screen you revisit paints at once; any save clears it. |
| Read cache | store | Reads only (`shared/ops.ts`), per company and user, for `CACHE_TTL_SECONDS` (15). Any save through Cloud AOS clears the company's entries at once (generation number). On by default only against MySQL. |
| API keys | store | An accepted key is remembered for 60 s under the company's generation; a revoke forgets it at once. |

**The one trade-off:** a change made outside Cloud AOS (the legacy AOS100 on the same database) can
take up to `CACHE_TTL_SECONDS` to show. Lower it, or set `CACHE_READS=false`, during periods when
both systems are used for the same module.

## 6. Settings

See `.env.example` for every option. The platform ones:

| Variable | Default | Meaning |
| :--- | :--- | :--- |
| `REDIS_URL` | empty | e.g. `redis://:password@redis-host:6379/0`. Empty: memory store. |
| `CACHE_READS` | on with MySQL | `false` switches the read cache off; `true` forces it on. |
| `CACHE_TTL_SECONDS` | `15` | Longest life of a cached read. |
| `LOG_REQUESTS` | errors and slow | `all` logs every API request as a JSON line. |
| `LOG_SLOW_MS` | `1000` | A request slower than this is logged. |
| `API_CORS_ORIGINS` | empty | Web origins allowed to call `/api/v1` from a browser (comma list). |

## 7. Rules that keep it fast and correct

* **Business rules live in services**, never in routes or screens. Both APIs call the same services,
  so a rule written once applies everywhere, including the Access Matrix.
* **A new read operation goes in `shared/ops.ts`**. Otherwise the browser treats it as a save (it
  clears caches) and the server cannot cache it.
* **Long work becomes a job** (`startJob`), not a long request.
* **Legacy tables are never altered.** Cloud AOS's own data goes into `ng_*` tables, created by the
  numbered scripts in `database/mysql` (run in each company database).
* **Measure before and after a UI change**: `node scripts/perf-sweep.cjs . perf.json` (app running on
  port 8180) opens every menu page; each must be ready in well under 300 ms with no layout shift.
