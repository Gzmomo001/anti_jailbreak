<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- Use `uv` instead of `pip`, `uv pip`, or bare `python` commands.
- Use `pnpm` and `pnpm dlx` instead of `npm` and `npx`.

## Agent skills

### Issue tracker

Issues are tracked in GitHub for `Gzmomo001/anti_jailbreak`; external pull
requests are not a triage request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the canonical triage label vocabulary documented in
`docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single domain context. Read `CONTEXT.md` and the
relevant ADR before changing domain behavior or module interfaces. See
`docs/agents/domain.md`.
