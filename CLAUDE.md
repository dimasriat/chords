
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->

## Development Workflow

### Workflow Phases

1. **Brainstorm → SOT**: Start every project/feature by deeply questioning requirements. Write the result as source-of-truth docs in `docs/`. SOT is the guardrail — all implementation must align with it.
2. **SOT → Issues**: Break SOT into beads issues. Each issue references the relevant SOT section and has testable acceptance criteria.
3. **Completion Check**: When a task is done, verify against SOT. Document any drift, decisions, or follow-up work as `--notes` on the beads issue.

### Rules

- **Every change gets an issue** — even small bugs. The goal is documenting decisions, not bureaucracy.
- **Backend: TDD is mandatory** — write the test from the AC first → run the test suite and confirm it FAILS (red) → implement → run the test suite and confirm it PASSES (green). Never implement before the test exists.
- **Frontend logic: TDD via shared modules** — pure functions (formatting, normalization, parsing, prompt building) must live in shared/service modules, not inside UI components. TDD these like backend code. Rule of thumb: if a function doesn't need the UI framework, `document`, or `window`, it belongs in a testable module.
- **Frontend components: browser automation** — component lifecycle, rendering, and visual layout are verified via browser automation. No unit tests for components.
- **SOT is authoritative** — if implementation differs from docs, the default is implementation adjusts. If docs need updating, document the decision in the issue notes.
- **Issue notes replace PR reviews** — since work may be local-only, use `bd update <id> --notes` to record completion checks, drift analysis, and decisions.
- **Commit after closing each issue** — every `bd close` must be immediately followed by a git commit. Do not batch multiple issues into one commit.
- **Conventional title prefixes** — both beads issue titles AND git commit messages must start with a Conventional Commits type prefix: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`, `build:`, `ci:`, `style:`. Example issue title: `feat: chord symbol parser`. Example commit: `test: failing tests for chord parser`.
- **Never mix the test DB with the deployed DB** — tests MUST use an isolated database (`:memory:` or a throwaway temp file), never the production data file. Production code must never use `:memory:`. A test run must be incapable of reading, writing, or deleting deployed data.
- **Deployed DB lives in `data/`** — the sqlite file is `data/chords.db` (override via `CHORDS_DB_PATH`). The entire `data/` directory is gitignored and never committed.
