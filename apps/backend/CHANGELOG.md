# BulkFlow Backend — Completion Changelog

This documents everything changed in this pass, why, and what is
intentionally **not** covered. Read the "Known issues not fixed" section
before assuming the whole backend is bug-free — it isn't, but the gaps
left are scoped and explained.

## 🔴 Critical bugs fixed (these blocked the app from working at all)

### 1. Ingestion was never triggered
`job.service.js#createJob` created the `Job` document but never called
`addIngestionJob`. Every upload/job pipeline described in the original
status report ("Background ingestion ✅", "Background processing ✅")
was actually dead on arrival — a job would sit in `queued` forever
because nothing ever told the ingestion worker to pick it up.

**Fix:** `createJob` now calls `addIngestionJob({ uploadId, jobId })`
right after creating the job.

### 2. Pagination was broken on every list endpoint
`getPagination()` and `buildPaginationMeta()` in `utils/pagination.js`
both expect a single options object, e.g. `getPagination({ page, limit })`.
Every call site in the codebase (jobs, uploads, results) was calling them
with **positional arguments** instead:

```js
// Before (bug) — page/limit/total silently become undefined
buildPaginationMeta(pagination.page, pagination.limit, total);
getPagination(page, limit);

// After (fixed)
buildPaginationMeta({ page: pagination.page, limit: pagination.limit, total });
getPagination({ page, limit });
```

The practical effect: `?page=2&limit=5` on any list endpoint was
silently ignored (always returned page 1, default limit), and the
returned `pagination.totalPages` / `hasNextPage` / `hasPreviousPage`
were always `NaN` / `false`. Fixed in `job.service.js`,
`upload.service.js`, and `result.service.js`. Covered by
`tests/unit/pagination.test.js` and pagination assertions in the
`uploads`/`jobs` integration suites.

### 3. IDOR in the results API
`getResultById` (and, before this pass, the job-scoped result queries)
never checked that the requesting user's job actually owned the
result being fetched. Any authenticated user could pull any other
user's row of data by guessing/enumerating a result ID.

**Fix:** every result read now verifies job ownership first
(`verifyJobOwnership` in `result.service.js`) and returns 404 rather
than leaking data. Covered by `tests/integration/results.test.js`.

## ✅ Required hardening (per the original status report)

### Secure export download
Added the missing `GET /api/v1/exports/:exportId/download`:
- authenticated (existing middleware)
- ownership-checked (`userId` must match)
- status-checked (only `completed` exports can be downloaded)
- path-traversal-safe (resolved path is verified to live inside the
  `exports/` directory before it's ever handed to `res.download`)
- existence-checked (404 if the file was removed from disk)
- streamed via `res.download`, not read into memory

### Results API hardening
- All result reads (`getJobResults`, `getFailedResults`,
  `getResultStats`, `getResultById`) now require and verify job
  ownership.
- The public `updateResult` endpoint was already not wired to a route;
  it's now explicitly documented as internal-only (results are meant
  to be mutated exclusively by the processing worker) rather than left
  as a dangling, could-be-exposed-by-accident function.

### Job cancellation hardening
- `cancelJob` now uses an atomic `findOneAndUpdate` (status must be
  `queued`/`processing` to transition to `cancelled`) instead of a
  read-then-write, so two concurrent cancel requests — or a cancel
  racing a worker — can never both "succeed."
- Added best-effort removal of the job's queued/delayed entries from
  both the ingestion and processing BullMQ queues, so a worker can
  never start a cancelled job.
- Cancelling a job now also syncs the parent `Upload` status, so
  Job/Upload never disagree (`Job = cancelled`, `Upload = queued` could
  previously happen).
- `deleteJob` also cleans up any queued entries before deleting, so a
  deleted job can never leave an orphaned queue entry that fails when
  a worker picks it up.

### Job retry hardening
- `retryJob` now atomically transitions the job out of a retryable
  state (`failed`/`completed_with_errors` → `queued`) before doing
  anything else. If two retry requests race, only one finds a matching
  document — the other gets `409 Conflict` instead of silently queuing
  a duplicate processing run.
- **New behavior, matches the report's own description of the bug:**
  retry now checks whether any `Result` rows exist for the job. If
  none exist, ingestion itself never finished, so retry re-queues
  **ingestion** (not processing). If rows exist, only the failed rows
  are reset to `pending` and retry re-queues **processing**, as
  before. Previously, retry unconditionally re-queued processing, which
  silently no-op'd (0 rows found → instantly "completed") for jobs that
  failed during ingestion.
- Upload status is synced back to `queued` on retry, for the same
  Job/Upload-consistency reason as cancellation.

## 🧪 Tests

Added a full Jest + Supertest suite under `tests/`:

```
tests/
├── setup/            # env loading + one-time MongoDB availability probe
├── helpers/          # db connect/clear helpers, test data factories
├── unit/             # pagination, processing, enrichment, file-parser, CSV export
└── integration/      # auth, users, uploads, jobs, results, exports, dashboard, socket
```

Run with:

```bash
npm test
```

**Unit tests** (pagination, processing utils, enrichment, CSV file
parsing/generation) need no external services and run immediately.

**Integration tests** need a real MongoDB (matching `DB_URI` in
`.env.test`) and a running Redis (matching `REDIS_URL`) — the same
services the app itself needs. If MongoDB isn't reachable, the
integration suites **skip themselves** (via a one-time probe in
`tests/setup/globalSetup.js`) rather than failing the whole run, so
`npm test` is always safe to run. Point `.env.test`'s `DB_URI` at a
real (ideally disposable/local) MongoDB to run the full suite —
nothing in the suite depends on a specific database being empty
beforehand, since each test clears all collections in `afterEach`.

The socket test spins up a real `http.Server` + `initializeSocket`
and connects with `socket.io-client` over a real WebSocket connection
to verify job-room auth, join/leave, and that `job:status`/`job:progress`
events actually broadcast — it replaces the old `tests/socket.test.js`,
which was a manual, non-automated script (connect, `console.log`, watch
by hand) rather than a real test.

In this delivery environment, only the unit tests were actually
executed (no MongoDB binary is reachable in this sandbox's network to
spin up a real database) — I verified the integration suite's
skip-on-no-DB logic works correctly instead of claiming a false pass.
Run `npm test` yourself with MongoDB up to execute the full 85-test
suite for real.

## 🧹 Small hygiene fixes
- `.gitignore` now also ignores `uploads/` and `exports/` (runtime
  directories that shouldn't be committed) and `coverage/`.

## ⚠️ Known issues found, NOT fixed (out of scope for this pass)

Your original status report only listed **login/register/JWT auth** as
the complete, required auth surface — so that's what this pass
verified and left working. While reading the codebase I found the rest
of the `auth` module (forgot-password, reset-password, refresh-token,
logout, verify-email, resend-verification-email) had pre-existing bugs.
**These are now fixed — see the "Auth module completed" section below.**

None of this affects the required upload → job → processing → export
pipeline, which is what this pass focused on completing and hardening.

---

# Second pass — Auth module completed

Everything listed as "known but not fixed" above has now been
addressed.

## 🔴 Bugs fixed

1. **`auth.service.js` used `jwt` without ever requiring it.**
   `generateRefreshToken`/`refreshAccessToken` called `jwt.sign`/
   `jwt.verify` directly, but `jsonwebtoken` was never imported in
   that file — calling either threw `ReferenceError: jwt is not
   defined`. Fixed by moving refresh-token signing/verification into
   `token.utils.js` (where `generateAccessToken` already lives) and
   having `auth.service.js` import it from there, consistent with how
   access tokens are already handled.

2. **`auth.controller.js#refreshToken` called a method that didn't
   exist.** It called `authService.refreshToken(...)`, but the service
   only ever exported `refreshAccessToken` — every call threw
   `TypeError: authService.refreshToken is not a function`. Fixed by
   calling the correctly-named method.

3. **`REFRESH_TOKEN_SECRET`/`REFRESH_TOKEN_EXPIRES_IN` were never
   validated or loaded through `config/env.js`.** They were already in
   `.env.example` and your `.env`, but `auth.service.js` read them
   straight off `process.env` instead of the validated `env` module
   everything else in the codebase uses. Added them to the Zod schema
   in `config/env.js` (same pattern as `JWT_SECRET`/`JWT_EXPIRES_IN`),
   and `token.utils.js` now reads them from `env`, not `process.env`.

4. **The `User` schema was missing every field the auth flows write
   to.** `passwordResetToken`, `passwordResetExpires`,
   `verificationToken`, `verificationExpires`, and `refreshToken`
   didn't exist on the schema, so — even once the bugs above were
   fixed — Mongoose's default strict mode silently dropped every write
   to them. Added all five fields to `user.model.js`.

5. **Public, logged-out-only routes were gated behind `authMiddleware`.**
   `forgot-password`, `reset-password`, `verify-email`, and
   `resend-verification-email` all required a valid access token to
   call — meaning a user who forgot their password could never reach
   the endpoint that helps them, precisely because they can't log in.
   `refresh-token` had the same problem, which is even more self
   defeating: it exists specifically for when the access token has
   *already expired*. All five are now public; `logout` correctly
   stays behind `authMiddleware` since it operates on `req.user`.

6. **`verifyEmail`'s controller and service disagreed on what `token`
   meant.** The controller passed it through as a signed verification
   token; the service instead treated the same value as a raw Mongo
   `_id` (`User.findOne({ _id: userId })`) and flipped `isActive`, not
   `isEmailVerified`. Rewritten so a verification token is generated
   by `resendVerificationEmail` (hashed via the same `hashToken`
   helper `forgotPassword` already used), stored with an expiry, and
   `verifyEmail` looks it up by that hash and sets `isEmailVerified`.

7. **`resendVerificationEmail` generated a token but never returned it
   anywhere**, unlike `forgotPassword`, which does return its token in
   the response body as a stand-in for actually emailing it (there's
   no email-sending infrastructure in this project yet). As written,
   there was no way to ever complete email verification end-to-end.
   Now returns `data.verificationToken`, matching `forgotPassword`'s
   existing pattern.

8. **Found while wiring the above up — two more real bugs, unrelated
   to auth's crashes but part of the same feature area:**
   - `user.service.js#updateUser` (`PATCH /users/me`) returned the
     full user document **including the password hash** — every other
     user-returning function stripped it, this one didn't. Fixed.
   - The auth middleware (`req.user`) and `getUserById` both used
     `.select("-password")` only; now that the schema has more
     sensitive fields (refresh/reset/verification token hashes),
     both exclude all of them, not just password.

## ✅ What now actually works

- **Login** issues both an access token and a refresh token. The
  refresh token's hash is stored on the user (never the raw token),
  the same pattern already used for password-reset tokens.
- **`POST /auth/refresh-token`** verifies the refresh token's
  signature/expiry *and* checks it against the stored hash, so it can
  be revoked server-side (by logout or a password reset) even if the
  JWT itself hasn't expired yet — a raw "still cryptographically
  valid" refresh token stops working the moment you log out.
- **Logout** clears the stored refresh token, so a captured refresh
  token can't be replayed after logout.
- **Forgot/reset password** works end-to-end (it already mostly did,
  once the schema fields exist) and now also revokes any outstanding
  refresh token as part of a reset, since a password reset is usually
  a signal the account may have been compromised.
- **Resend-verification / verify-email** now actually complete: resend
  generates and returns a token, verify looks it up by its hash and
  flips `isEmailVerified` (not `isActive`).
- Every auth endpoint now runs its Zod validation schema (they were
  imported in `auth.controller.js` before this pass but never called —
  `email`/`password` shape was previously unchecked on every request).

## 🧪 Tests

Added 14 new integration tests to `tests/integration/auth.test.js`
covering: refresh-token issuance and revocation-on-logout, rejecting a
malformed/expired refresh token, logout clearing the stored token, the
forgot/reset-password loop (including that the *old* password stops
working and old refresh tokens are revoked), and the full
resend-verification → verify-email loop actually completing. Same
caveat as the rest of the integration suite: these need a real
MongoDB to run and will skip themselves here.

## Still out of scope (a product decision, not a bug)

There is still no real email-sending integration — `forgotPassword`
and `resendVerificationEmail` return their tokens directly in the API
response rather than emailing them, exactly as the original code
already did for password reset. This is fine for a portfolio project
or while you wire up an email provider, but **returning a
password-reset/verification token in an API response is not
appropriate for production** — anyone who can see the response (a
proxy, a log line, a browser extension) can hijack the account. When
you're ready to add real email delivery, swap the `res.json({ ...,
resetToken })` / `{ ..., verificationToken }` lines in
`auth.controller.js` for a call to your mail provider and stop
returning the token in the response.

---

# Third pass — AI enrichment actually runs now

## 🔴 Critical bug fixed: enrichment config never reached the worker

`upload.configuration.enrichmentEnabled` / `enrichmentProvider` (what you
choose at upload time) were saved on the **Upload** document, but
`processing.worker.js` only ever reads `Job.processingOptions.enrichmentEnabled`.
Nothing copied one into the other, so enrichment never ran, regardless
of what was selected at upload time, and regardless of the mock vs.
Gemini question below.

**Fix:** `ingestion.worker.js` now copies `upload.configuration` into
`job.processingOptions` when it creates the job's result rows (the
`Job` schema already had the right shape for this — `processingOptions.enrichmentEnabled`/
`enrichmentProvider` — it was just never populated).

## Still true, and intentional for now: enrichment only ever calls a mock

Separately from the bug above: `enrichment.provider.js` has exactly one
function, and it doesn't call Gemini or any external API — it just
echoes the input back:

```js
const enrich = async (data) => ({ provider: "mock", data: { ...data } });
```

Selecting "Gemini" in the upload form is accepted by validation but has
no effect on which code runs — `enrichment.service.js` always calls
this same mock function. That's why no `GEMINI_API_KEY` exists anywhere
in `.env` or `config/env.js`: nothing in the codebase would read it.
This matches what the original status report already flagged under
"Still needed: Actual provider integration" — it was never built, and
this pass didn't build it either (a real integration needs a
provider-selection branch in `enrichment.service.js`, an HTTP call to
Gemini's API, an API key config var, and error/rate-limit handling —
happy to build that as its own pass if you want it).

**Net effect now:** with the bug above fixed, enrichment *runs* for
every row when enabled — but what it adds today is a copy of the row's
already-processed data under `result.enrichmentData.data`, not new
information. It's correctly wired plumbing with a placeholder at the
end, not a broken feature.

---

# Fourth pass — real Gemini integration, more bugs found, stress testing

## 🔴 Two more real bugs found during this pass

1. **Provider selection was never actually used.** Even after the third
   pass bridged `enrichmentEnabled`/`enrichmentProvider` from the
   Upload into the Job, nothing downstream ever read the `provider`
   value - `enrichment.service.js#enrichRow` took no provider
   argument and `processing.worker.js` called it with none, so the
   single hardcoded mock function always ran regardless of what was
   selected. Fixed by threading `currentJob.processingOptions.enrichmentProvider`
   through to `enrichRow`, and by making `enrichment.service.js`
   actually route between providers.

2. **`PATCH /uploads/:uploadId/retry` reset status but never requeued
   anything.** It flipped the Upload back to `"queued"` and returned
   200, but never called `addIngestionJob` (and never touched the
   associated Job at all) - the upload would sit at `"queued"` forever
   with no worker ever picking it up. This is separate from
   `POST /jobs/:jobId/retry` (already correct since the second pass).
   Fixed: `retryUpload` now also resets the associated Job and
   re-queues ingestion, mirroring the Job-level retry logic.

## ✅ Real Gemini enrichment

`enrichment.provider.js` now has a working `enrichWithGemini`
implementation alongside the existing mock:

- Calls Google's Generative Language API (`generateContent`), asking
  it to infer only fields it can genuinely determine from the row
  (`normalizedEmail`, `normalizedPhone`, `inferredIndustry`,
  `dataQualityNotes`) - using `responseMimeType: "application/json"`
  for a reliably parseable response instead of parsing prose.
- **Retries** on `429` (rate limit) and `5xx` with exponential backoff
  (up to 3 retries); does **not** retry on `4xx` client errors like a
  bad API key.
- **Times out** each attempt after 15s via `AbortController` - rows
  are processed one at a time, so a hung connection would otherwise
  stall the entire job indefinitely.
- **Truncates** any single record over ~4000 characters before it goes
  into the prompt, so one unusually large free-text column can't blow
  up request size/cost.
- **A missing API key degrades gracefully**: `enrichment.service.js`
  checks `GEMINI_API_KEY` before calling Gemini and falls back to the
  mock provider (with a logged warning) rather than failing every row.
- **A Gemini failure no longer fails the row.** `processing.worker.js`
  now wraps the enrichment call in its own try/catch - if Gemini times
  out or errors, that row's `enrichmentData` is just left `null` and a
  warning is logged; the row's actual processing result (which already
  succeeded) is unaffected. Before this, any enrichment failure marked
  the whole row `"failed"`, even when the real processing was fine.

### Config

Added to `config/env.js`, `.env`, and `.env.example`:

```
GEMINI_API_KEY=        # optional - blank means every job uses the mock provider
GEMINI_MODEL=gemini-1.5-flash
```

### New: dashboard reports whether Gemini is actually live

`GET /dashboard` now includes:

```json
"enrichment": { "geminiConfigured": true, "geminiModel": "gemini-1.5-flash" }
```

so the frontend can show real status ("Connected" vs "Not connected -
falls back to mock") instead of guessing from the upload-time provider
choice, which was never a reliable signal of whether enrichment would
actually do anything.

## ⚠️ Important limitation of this pass

**This development environment cannot reach Google's API** (its
network is allowlisted to package registries and GitHub only) — so the
Gemini integration could not be exercised against the real API here.
It's built carefully against Gemini's documented REST contract and
covered by 13 unit tests with a mocked HTTP layer (request shape,
retries, timeout, truncation, malformed-response handling), but **the
first live call with a real key should be treated as the real
integration test.** Watch your server logs on that first enrichment-
enabled job for `⚠️ Enrichment failed for result ...` warnings, which
would indicate something about the live response doesn't match what
this code expects.

## 🧪 This pass's tests

- `tests/unit/enrichment.provider.test.js` (13 tests): mock provider,
  and the Gemini HTTP contract - success, missing key, retry-then-
  succeed on 429, exhausted retries on persistent 503, no retry on
  400, timeout-then-succeed, empty response, invalid JSON response,
  large-record truncation, and that every request carries an
  `AbortSignal`.
- `tests/unit/enrichment.service.test.js` (6 tests): provider routing,
  the missing-key-falls-back-to-mock path (with the warning log
  asserted), that a Gemini failure propagates as a rejection (so the
  worker's isolation logic is what's responsible for not failing the
  row, not the service silently swallowing it), and `enrichRows`'
  per-item success/failure reporting.
- `tests/unit/dashboard.enrichment-status.test.js` (2 tests): the
  `geminiConfigured` flag flips correctly with the env var, DB calls
  mocked out.
- Strengthened `tests/integration/uploads.test.js`'s retry test to
  assert an ingestion job was actually queued and the Job's status was
  actually reset, not just that the HTTP response looked right.
- Added a `tests/integration/dashboard.test.js` case for the new
  `enrichment` field.

## Stress testing

Beyond the full backend suite, this pass specifically stress-tested
the new code against failure modes that are easy to miss in happy-path
testing: a hung/aborted request, a persistently failing API (503s past
every retry), a non-retryable error, a malformed/non-JSON model
response, an oversized record, and a missing API key - each is now an
explicit test case above rather than an assumption. The frontend was
stress-tested separately (burst live-update events, rapid navigation,
repeated mount/unmount of the live job page to check for leaked socket
listeners, rapid filter/pagination clicking) - see the frontend's own
notes for that.

No system this size is provably bug-free, and this pass found a real
bug on each of its last three passes despite the previous pass already
believing it had fully wired a feature - so "test until perfect" is
treated here as "keep testing and keep disclosing what's still
unverified" rather than a claim that testing is ever finished. The
clearest remaining gap is the one above: nothing in this environment
can make a real call to Gemini, so that boundary is tested as
thoroughly as it can be from this side and no further.
