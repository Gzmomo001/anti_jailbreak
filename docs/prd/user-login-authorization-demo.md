# User Login and Authorization Demo

## Problem Statement

The assignment needs a publicly reachable demonstration of registration,
login, asynchronous username moderation, and resource authorization. A
reviewer must be able to register a user, observe that the username is not
immediately visible to other users, access an allowed resource, be denied from
a restricted resource, and use a pre-provisioned account that can access the
restricted resource.

The registration flow must use an LLM to judge whether a username is a
community violation. The LLM decision does not need perfect moderation
quality, but the implementation must make the decision process observable and
the Markdown delivery note must explain debugging and prompt optimization
lessons.

## Solution

Build a small responsive web application deployed to Vercel. Supabase Auth
handles email/password identity and sessions. Supabase PostgreSQL stores
profiles, published and pending usernames, moderation jobs, resources, and
explicit resource permissions. Supabase Queue stores moderation work.

Registration returns immediately after creating the account and an initial
pending profile. A queue message is then processed by a single sequential
Supabase Edge Function worker that calls SiliconFlow. A successful moderation
decision moves the username to `approved` or `rejected`; an uncertain decision
moves it to `needs_human_review`; infrastructure or provider failures move it
to `error`.

The current published username remains visible while an approved user waits
for a replacement username to be moderated. Only the latest username revision
can change the published value. A new user without a published username is
not shown to other users until approval.

The application provides two read-only mock resources:

- Resource A is available to every authenticated user.
- Resource B is denied by default and available only to a seeded test account
  with an explicit permission row.

The delivery includes the Vercel URL, test-account credentials for Resource B,
versioned database migrations and seed data, focused automated tests, and a
Markdown explanation of implementation, architecture, AI coding usage,
personal time allocation, and priorities.

## User Stories

1. As a visitor, I want to open the public application URL, so that I can
   evaluate the demo without local setup.
2. As a visitor, I want to open the registration page, so that I can create a
   demo account.
3. As a visitor, I want to register with an email, password, and username, so
   that I can use the protected application.
4. As a registrant, I want registration to complete without waiting for the
   LLM, so that a provider delay does not block account creation.
5. As a registrant, I want to see that my username is pending moderation, so
   that the asynchronous workflow is understandable.
6. As a registrant, I want invalid username formats to be rejected before an
   LLM call, so that I receive immediate and actionable validation feedback.
7. As a registrant, I want usernames to support Chinese, English, numbers,
   underscores, and hyphens, so that normal community names are accepted.
8. As a registrant, I want the system to enforce a two-to-twenty-character
   username length, so that identifiers remain usable and bounded.
9. As a registrant, I want the username to be globally unique, so that other
   users cannot be confused with me.
10. As a registrant, I want the system to normalize usernames for uniqueness
    checks while preserving display casing, so that `Alice` and `alice` do not
    collide unexpectedly.
11. As a registrant, I want my username submitted to a moderation queue, so
    that the LLM can process it in the background.
12. As a registrant, I want an approved username to become visible to other
    users, so that successful moderation has a visible result.
13. As a registrant, I want a rejected username to remain hidden from other
    users, so that the moderation decision has an enforcement effect.
14. As a registrant, I want an uncertain username to enter human-review status,
    so that the system does not pretend the LLM is always confident.
15. As a registrant, I want an API failure to show an administrator email and a
    retry action, so that I know how to recover from provider failure.
16. As a registrant, I want a retry to create a new moderation attempt, so that
    a temporary provider failure does not permanently block me.
17. As a user, I want to edit my username during any moderation state, so that
    I can correct or replace a previous submission.
18. As a user, I want editing my username to invalidate the previous
    moderation revision, so that an old LLM result cannot overwrite my latest
    choice.
19. As an approved user, I want my current published username to remain visible
    while a replacement username is pending, so that editing does not erase my
    identity immediately.
20. As an approved user, I want a newly approved username to replace the old
    published username atomically, so that other users see one consistent name.
21. As a user, I want both the published and pending usernames reserved during
    a transition, so that another account cannot claim either name mid-review.
22. As a user, I want the old username released after a replacement is
    approved, so that it can be reused according to the product rule.
23. As a user, I want a human-review username to remain unchanged until a
    human decision exists, so that the system does not silently approve it.
24. As a user, I want to log in with email and password, so that I can return
    to my account.
25. As a user, I want to log out, so that my session is no longer active.
26. As an unauthenticated visitor, I want protected pages to require login, so
    that resources are not anonymously accessible.
27. As an authenticated user, I want to access Resource A, so that the default
    authenticated permission is demonstrated.
28. As an authenticated user without an explicit grant, I want Resource B to
    return a clear forbidden result, so that default denial is demonstrated.
29. As the seeded test user, I want to access Resource B, so that the reviewer
    can verify explicit authorization.
30. As a reviewer, I want to see a members page containing only approved
    published usernames, so that moderation visibility can be verified.
31. As a reviewer, I want a pending new username to be absent from the members
    page while its old published username remains present, so that replacement
    semantics are visible.
32. As a reviewer, I want Resource A and Resource B to have distinct mock
    content, so that the authorization result is easy to observe.
33. As a reviewer, I want the test account credentials in the delivery
    Markdown, so that I can verify Resource B without registering first.
34. As a maintainer, I want all secrets to be cloud environment variables, so
    that API keys are not committed to the repository.
35. As a maintainer, I want the LLM model to be configurable, so that the
    moderation provider can be tuned without code changes.
36. As a maintainer, I want the queue worker to process one task at a time, so
    that moderation order and state transitions are easy to reason about.
37. As a maintainer, I want stale queue messages to be ignored using a
    moderation revision, so that retries and edits are safe.
38. As a maintainer, I want database RLS to enforce resource access, so that
    client-side controls are not the security boundary.
39. As a maintainer, I want server-side authorization errors to distinguish
    unauthenticated and forbidden requests, so that clients can render useful
    states.
40. As a maintainer, I want migrations and seed data to be versioned, so that
    the public deployment can be reproduced.
41. As a maintainer, I want focused automated tests for username validation,
    revision invalidation, authentication, and resource authorization, so that
    the highest-risk behavior is protected.
42. As an evaluator, I want a Markdown implementation note, so that I can
    understand the architecture and engineering trade-offs.
43. As an evaluator, I want the implementation note to include the three-day
    time plan, so that I can assess prioritization.
44. As an evaluator, I want the implementation note to identify the AI coding
    tools and approximate token usage, so that the development process is
    transparent.
45. As an evaluator, I want the implementation note to identify the most
    time-consuming human work, so that I can distinguish model output from
    engineering effort.
46. As an evaluator, I want the implementation note to identify the highest
    priority for this scenario, so that the candidate's product judgment is
    visible.

## Implementation Decisions

- Use Next.js App Router, TypeScript, and Tailwind CSS for the web
  application.
- Deploy the web application to Vercel. Cloudflare may provide DNS or a custom
  domain, but it is not part of the core runtime path.
- Use Supabase Auth for email/password authentication and sessions. Email
  verification is disabled for this time-boxed demo; production guidance will
  mention enabling it.
- Use Supabase PostgreSQL for application data and RLS for the final database
  authorization boundary.
- Model identity and display data separately: Supabase Auth owns email
  identity, while the application profile owns the moderated username.
- Enforce username format before queueing: two-to-twenty characters, allowing
  Chinese, English, digits, underscore, and hyphen.
- Store the display form and a normalized form. Uniqueness is global and
  case-insensitive.
- Keep `published_username` and `pending_username` separate so an approved
  user's old name remains visible while a replacement is reviewed.
- Track `moderation_revision` on the profile and copy the revision and
  username snapshot into each moderation job. Workers must ignore stale
  revisions.
- Reserve both published and pending names during a transition. Release the
  old name after a replacement is approved.
- Use moderation states `pending`, `approved`, `rejected`,
  `needs_human_review`, and `error`.
- Use a structured LLM response with `approve`, `reject`, or `human_review`
  as the decision and a short reason. Malformed output, timeout, and provider
  failures become `error`; uncertainty becomes `needs_human_review`.
- Create a queue message when a new username or retry is submitted. Use
  Supabase Queue and a Database Webhook to trigger a Supabase Edge Function
  worker. The worker claims one message at a time under a database lock.
- A provider error is terminal for that attempt: mark the job `error`, expose
  the configured administrator email, and let the user explicitly retry.
- Username edits are transactional from the application perspective: update
  the profile revision, invalidate the old job, reserve the new name, and
  enqueue the new snapshot. The latest revision wins even if an old worker has
  already started.
- Do not build an administrator UI. Human-review decisions can be completed
  manually through Supabase for this demo.
- Seed two read-only resources. Authenticated users can read Resource A;
  Resource B requires a row in an explicit user-resource permission table.
- Seed and confirm a dedicated Resource B test account. Its credentials are
  published in the delivery Markdown, while service-role credentials remain
  server-side.
- Use server-side routes or actions for business operations and never call
  SiliconFlow directly from the browser.
- Configure `SILICONFLOW_API_KEY`, `SILICONFLOW_MODEL`, and
  `MODERATION_ADMIN_EMAIL` as cloud environment variables.
- Version migrations, RLS policies, queue setup, resource seed data, and test
  account setup in the repository.
- Provide login, registration, dashboard, resource pages, members page,
  username status/edit controls, error retry, and logout. Keep the UI
  functional and scan-friendly rather than adding unrelated product features.
- Keep the local repository on `main` and connect the GitHub repository as the
  `upstream` remote.
- Deliver by August 20, 2026 at 24:00 China Standard Time, equivalent to
  August 21, 2026 at 00:00 China Standard Time.

## Testing Decisions

- Test external behavior at the highest practical seam. Prefer end-to-end
  flows for authentication, visibility, and resource authorization; use unit
  tests only for deterministic username rules and revision/state logic.
- Verify a new user can register without waiting for the LLM response and sees
  a pending status.
- Verify invalid username formats and normalized uniqueness conflicts are
  rejected before queue creation.
- Verify an approved first username appears in the members list.
- Verify a rejected, human-review, pending, or error username is not exposed
  as a new public username.
- Verify an approved user's old name remains visible while a replacement is
  pending, rejected, human-reviewed, or errored.
- Verify a newly approved replacement atomically becomes the published name.
- Verify a stale moderation job cannot overwrite a newer username revision.
- Verify an error state exposes the administrator email and that retry creates
  a new current revision.
- Verify unauthenticated access is denied, an authenticated user can access
  Resource A, a normal authenticated user is denied Resource B, and the
  seeded test user can access Resource B.
- Verify both the server-side authorization path and database RLS reject an
  unauthorized Resource B read.
- Test the queue worker with mocked SiliconFlow responses for approval,
  rejection, human review, malformed output, timeout, and API error.
- Keep the tests independent of exact LLM wording. Assert state transitions,
  visibility, authorization results, and user-facing recovery behavior.

## Out of Scope

- Administrator dashboard or in-app manual review workflow.
- Email verification, password reset email, social login, MFA, and account
  recovery.
- Resource creation, editing, deletion, sharing, or collaborative workflows.
- Complex role management beyond explicit user-resource permissions.
- Full moderation policy accuracy, model training, or adversarial benchmark
  coverage.
- Automatic moderation retries after a provider error.
- Search, pagination, notifications, analytics, billing, and production
  multi-tenant isolation.
- A separate Redis, RabbitMQ, or long-running server deployment.
- Cloudflare proxy features beyond optional DNS or custom-domain configuration.
- Polished marketing pages, complex animation, or a design system.

## Further Notes

- The delivery Markdown must describe the three-day plan, architecture and
  technology choices, AI coding tools and approximate token usage, human time
  allocation, and the highest-priority concern for this scenario.
- The moderation section should record prompt iterations, structured-output
  parsing, representative test inputs, observed failure modes, and the
  difference between model uncertainty and provider failure.
- The most important acceptance property is not perfect LLM moderation. It is
  that authentication, authorization, username visibility, queue revisions,
  and provider failure recovery behave predictably.
- The public demo should make the critical paths discoverable within a few
  minutes and include enough status text for a reviewer to understand what is
  happening without reading source code.
