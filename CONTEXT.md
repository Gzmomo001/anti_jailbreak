# Domain Context

## Purpose

This application demonstrates account registration, asynchronous username
moderation, and deny-by-default resource authorization.

## Vocabulary

**Account** — the authenticated identity owned by Supabase Auth. An account is
identified by an immutable UUID and signs in with email and password.

**Profile** — application-owned state associated one-to-one with an account.
It carries username publication and moderation state, not authentication
credentials.

**Published username** — the globally unique username currently visible to
other users. A new account has no published username until its first approval.

**Pending username** — the globally unique candidate currently awaiting a
moderation result. It never replaces the published username before approval.

**Username reservation** — exclusive ownership of a normalized username by an
account. Both published and pending usernames are reserved during a rename.

**Moderation revision** — a monotonically increasing number identifying the
latest pending username submission for a profile. Only a result matching the
current revision may change profile state.

**Moderation job** — an immutable snapshot of account ID, pending username,
and moderation revision placed on the moderation queue.

**Moderation state** — one of `pending`, `approved`, `rejected`,
`needs_human_review`, or `error`.

**Moderation decision** — an LLM result of `approve`, `reject`, or
`human_review`, accompanied by a short reason.

**Provider error** — a timeout, transport failure, malformed structured
response, or unavailable SiliconFlow model. It produces the `error` state and
allows an explicit user retry.

**Worker lease** — exclusive, time-limited ownership of queue processing. It
ensures moderation jobs are sent to the LLM sequentially even when multiple
webhooks invoke the worker.

**Resource** — a read-only document identified by a stable slug.

**Permission** — an explicit account-to-resource grant. Resource A requires
authentication only; Resource B requires an explicit permission.

**Actor** — the authenticated account attempting an operation, or an anonymous
visitor when no session exists.

**Visible member** — a profile with a published username. Pending usernames and
profiles without a published username are not visible in the member directory.

## Invariants

1. Normalized usernames are globally unique across published and pending
   reservations.
2. A moderation result can apply only when its revision matches the profile's
   current moderation revision.
3. A pending username never replaces a published username before approval.
4. Rejection, human review, and provider error leave an existing published
   username unchanged.
5. Approval publishes the pending username and releases the previous published
   username in one database transaction.
6. Only one worker lease may be active at a time.
7. Resource B is inaccessible unless an explicit permission exists.
8. Browser visibility controls are never the authorization mechanism.

