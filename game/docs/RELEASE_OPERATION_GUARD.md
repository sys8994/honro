# Release operation guard

`tools/release/guard.py` is a Python 3.10+ POSIX, standard-library CLI for an
**explicitly cooperating publisher**. It records decisions and evidence locally;
it cannot invoke MCP, approve a request, cancel an external call, discover tool
status, enforce another agent's behavior, or remove a required approval. Existing
ad hoc publisher scripts are not automatically wrapped by adding this file.

## Why this exists

The 2026-10-13 publisher records used `phase-<source>.json` (phase/source/branch),
`backfill-state-*.json` (queue/map/branches/blobs/trees/pending), raw tool responses,
and per-source receipts (source/remote/tree/source_parents/remote_parents).
Some knowledge also lived only in process memory. A phase named `create_blob`
does not distinguish an approval wait from submitted IO or an unknown outcome.
Reconstructing that distinction and historical commit chains delayed the final
snapshot. Preserve these old files as evidence, but do not import their booleans
or absence of receipts as proof that a write did/did not occur.

## Adoption, before the next remote write

1. Finish or reconcile the currently active publisher. Do not start this helper
   as a second writer, and do not retry the existing pending tool request.
2. Choose **one absolute journal path outside individual worktrees**, on a durable
   shared filesystem. All publishers use it. Do not use a fresh journal per branch.
   Choose one unique owner token per coordinator session (for example UUID).
3. Acquire that journal, and inventory old pending operations before any new
   writes. `plan` + `pending` records known approval waits; `plan` + `begin` +
   `uncertain` records previously submitted calls with unknown outcomes. These
   are local bookkeeping commands, not permission to invoke those calls again.
4. Plan the current validated production snapshot and its dependencies first.
   Historical backfill is a separate lane. Do not make all historical unit commits
   dependencies of production. Keep preserving each completed source change as
   its own local commit and later remote checkpoint; this queue is not discarded.
5. Integrate the CLI around **every** external write as described below. Stop the
   caller if any guard command exits nonzero. Store raw responses before parsing.
   A shared owner token belongs to the single coordinator, not independent agents.

Example (paths/IDs are illustrative; JSON inputs are real files):

```sh
G=/absolute/shared/honro-release/journal.json
OWNER=unique-coordinator-session
python tools/release/guard.py "$G" acquire --owner "$OWNER"
python tools/release/guard.py "$G" plan --owner "$OWNER" --input operation.json
python tools/release/guard.py "$G" begin --owner "$OWNER" --input begin.json
# Only after begin succeeds: submit this external tool call ONCE.
# Save its exact raw response; then perform an authorized read-only remote check.
python tools/release/guard.py "$G" reconcile --owner "$OWNER" --input evidence.json
python tools/release/guard.py "$G" tick --owner "$OWNER"
python tools/release/guard.py "$G" report
```

`operation.json`:

```json
{"repository":"sys8994/honro","kind":"ref","lane":"production","target":"heads/master","expected":{"sha":"0123456789012345678901234567890123456789"},"dependencies":[]}
```

`plan` returns a deterministic `id`. Blob/tree identity uses repository, kind,
and expected SHA, regardless of source unit/path/lane. An existing succeeded,
uncertain, or denied identity is returned unchanged, never made writable again.
A production plan promotes a shared historical object to production priority.
For commit operations, `expected` must instead contain the exact `tree`, ordered
`parents`, and full `message`; the read-back evidence additionally needs the
actual `remote_sha`. Commit creation timestamps need not be guessed.

`begin.json` uses that returned ID:

```json
{"id":"<returned id>","request_id":"<caller correlation ID>","authorization":"<current user/tool approval reference>","timeout_seconds":120}
```

A correlation ID is allocated before calling a tool; preserve any later provider
request ID in raw evidence. Use `pending` instead of `begin` when the platform
explicitly reports an approval wait. If an already-submitted request enters an
approval wait, record it as pending at initial adoption; for ongoing calls use
`await_approval` (same request ID), never submit it again. A later `begin` from
pending records that **same request** moving to IO after actual approval; it does
not authorize a second invocation. If the API does not expose approval state,
record `uncertain`, not an invented approval status. An explicit policy denial
uses `deny`, with `{"id":"...","evidence":"<raw response path/reason>"}`.
Denied operations cannot be restarted or reconciled by this helper. Seek the
specific authorization through the platform when needed, without another route.

`evidence.json`, collected by the caller from the exact remote target:

```json
{"id":"<returned id>","evidence":{"read_only":true,"source":"https://api.github.com/repos/sys8994/honro/git/ref/heads/master","checked_at":"2026-10-13T23:00:00Z","repository":"sys8994/honro","kind":"ref","target":"heads/master","observed":{"sha":"0123456789012345678901234567890123456789"}}}
```

Read existing blob/tree/commit/ref objects through the available authorized
connector. Normalize only fields actually read. A mismatch or missing object
leaves the operation unresolved: an external request can still finish later.
Matching positive evidence may resolve an interrupted operation without a retry.
The helper has no automatic retry. `end_no_effect` is permitted only with
explicit authoritative termination of the exact old request and a fresh remote
absence check after termination. Its input is `id` plus `evidence` containing
`request_id`, `tool_ended: true`, `tool_source`, `outcome` (failed/cancelled/expired),
`approval_resolution` (not_required/approved/cancelled/expired), numeric Unix
`ended_at`, and `remote` containing `read_only: true`, `absent: true`, `source`,
numeric `checked_at`, `repository`, `kind`, `target`, and the exact `expected`
identity. For a ref, absence means the intended target SHA was not applied;
record the actual observed ref in the raw source. The provider must attest the
call has ended, not merely that its local polling deadline expired.
A missing object alone, an unresolved approval, or a possibly-running call can
never unlock retry. Once state is `no_effect`, `retry` needs `id` and a renewed
explicit `authorization` reference. It preserves prior request IDs and evidence,
returns to planned, and requires a new request ID for the next submission. Any
new mandatory approval still applies. Denied operations cannot use this path. For refs, the caller must still use an expected-old-SHA/CAS non-force
update; the guard does not implement a remote compare-and-swap.

## Concurrency, deadlines and recovery

- `flock` protects each journal transaction; atomic replace + file and directory
  fsync persist it. A persistent owner token spans external calls. Elapsed time
  never steals ownership. This is a local/cooperative lock, not a distributed
  GitHub lock; all coordinators must share the same path and honor it.
- One coordinator may run up to three independent blob calls. Running **and
  uncertain** blobs count toward that bound, since uncertainty is not cancellation.
  The same object is never submitted twice. Non-blob IO is serialized. A distinct
  historical approval wait does not block production. The same target's pending
  or uncertain operation always blocks another write to that target.
- Backfill cannot start while planned production operations remain unverified.
  Explicit dependencies must succeed before their consumer can begin. A receipt
  for the production snapshot can be validated even with historical work pending.
- Call `tick` on progress/status checks, including after a tool wait yields.
  Deadlines are 1–1200 seconds, scoped per approval/IO phase. Expiry records a
  report/reconcile escalation; IO becomes `uncertain_write`. Approval stays
  `approval_pending`. **No cancellation, approval bypass or retry occurs.** The
  caller must report blockers and schedule the next read-only check; this CLI has
  no timer or user messaging access. A blocked synchronous call cannot be forcibly
  interrupted by this process.
- On interruption, inspect the old coordinator and any original tool handle.
  Only after independently verifying that the coordinator stopped may a new owner
  call `recover` with `previous_owner`, `coordinator_stopped: true`, and `evidence`.
  Recovery changes running IO to uncertain, not planned. Pending approvals remain
  pending. Local process death is not evidence that remote IO stopped. `release`
  refuses unresolved calls. Never delete a lock/journal to unblock a write.
- `report` emits status, overdue flags, elapsed seconds per phase, production
  blockers and the longest observed production phase. It does not invent a
  dependency critical path or combine parallel durations into wall time.

## Final deployment receipt

Use `receipt` with `{"manifest": ..., "receipt": ...}`. The manifest pins
`master` and `files: {"HONRO.html":"<sha256>","HONRO_WORKSHOP.html":"<sha256>"}`
from the tested final build. The receipt has `master`, `master_verified: true`,
`pages_head_sha`, `pages_run`, `pages_url`, `pages_status: "completed"`,
`pages_conclusion: "success"`, and `public_bytes`. Pages SHA must equal master.
Each of exactly four distinct rows has `url`, `status: 200`, `sha256`, and
`checked_at`: normal and `?release=<master SHA>` URLs for both HTMLs at the
existing `https://sys8994.github.io/honro/` site. Hashes must match the manifest;
`matches: true` alone is insufficient. Older receipts lacking Pages run SHA must
be supplemented by a real read of that run, not fabricated fields.

The guard validates caller-supplied evidence structure/equality, not its provenance
or freshness. Collect master, run and HTTP bytes together at final verification;
keep the exact raw evidence. Publication verification does not certify gameplay,
browser QA, assets, performance or the aggregate test suite. `public_qa` remains
separate and may still be pending. Do not call a release fully verified based on
this receipt alone.

Native Git bulk transport in an authorized, configured repository environment is
a future optimization. It needs verified setup and access. The current Gitdata
connector workflow has no confirmed bulk push route; this helper does not create
one, guess a proxy, copy credentials, or remove connector approvals.

Run `npm run test:release-guard`. No network or remote writes occur in the tests.
