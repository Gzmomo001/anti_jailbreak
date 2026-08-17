# Gatehouse

Gatehouse is a login, asynchronous username-moderation, and resource
authorization demo built for a three-day technical assignment.

## Local Development

Requirements:

- Node.js 24+
- pnpm 10+
- Supabase CLI 2+
- Docker Desktop

```bash
pnpm install
supabase start
supabase db reset
supabase functions serve process-moderation --env-file supabase/.env.local
pnpm dev
```

Copy `.env.example` to `.env.local` and configure the local Supabase values.
The moderation worker also requires `SILICONFLOW_API_KEY`,
`SILICONFLOW_MODEL`, and `MODERATION_WORKER_SECRET`.

`SUPABASE_SERVICE_ROLE_KEY` is only used by the local reviewer seed command.
Do not add it to Vercel or expose it to browser code.

## Cloud Deployment

Apply the database and Auth configuration, configure Edge Function secrets,
and deploy the worker:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase config push
supabase secrets set \
  SILICONFLOW_API_KEY='your-key' \
  SILICONFLOW_MODEL='Qwen/Qwen3-8B' \
  MODERATION_WORKER_SECRET='shared-random-secret'
supabase functions deploy process-moderation --use-api
```

Configure the following Vercel variables for Production and Preview:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_EDGE_FUNCTION_URL`
- `MODERATION_WORKER_SECRET`
- `MODERATION_ADMIN_EMAIL`
- `NEXT_PUBLIC_SITE_URL`

Create the non-administrator Resource B reviewer after exporting the local
service-role key:

```bash
pnpm seed:reviewer
```

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Architecture

The accepted module design and domain vocabulary live in:

- `CONTEXT.md`
- `docs/adr/0001-deep-module-design.md`
- `docs/prd/user-login-authorization-demo.md`

The database schema, RLS policies, queue functions, and seed resources are
versioned under `supabase/`.
