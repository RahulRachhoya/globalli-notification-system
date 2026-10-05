# How AI was used

This file records the real process, written while the work happened.

## Tools

- **Claude Code** (model: Claude Opus 5.5) running as a small team of agents in a local multi-agent setup:
  - an **orchestrator agent** that read the challenge and wrote the plan, and
  - a **builder agent** that wrote the code, tests and docs from that plan.
- Node.js, npm, `tsc`, `tsx`, `node:test`, git, GitHub CLI (`gh`).

The human reviewed and approved the plan before any code was written, and approved publishing the repo.

## Workflow

Requirements → plan → human approval → code in small steps → tests → review → fresh-clone check → publish.

### 1. Requirements and plan (orchestrator agent)

The orchestrator read `Coding Challenge.pdf` and wrote a plan: what the PDF asks for, the stack, architecture and patterns with reasons, the recipient rules, the demo script, the tests, the build order, and tradeoffs to defend. The full plan is in [docs/plan.md](docs/plan.md).

Things the plan caught before any code:
- The `Notification` class the PDF calls "provided" is **not in the PDF**. Decision: write our own with obvious field names and keep the swap to one line.
- The recipient for `friendRequestAccepted(1, 3)` is **user 3** (the one who sent the request), not user 1. Easy to get backwards.
- "Item Acquired" says *rare or valuable*, so common items should not notify.

### 2. Build (builder agent)

The prompt the builder received (verbatim, from the orchestrator):

> OBJECTIVE: build the Globalli coding challenge (real-time notification system for a gaming platform) end to end.
>
> INPUT: spec = Coding Challenge.pdf. Approved plan = globalli-notification-challenge.md. Follow the plan (TypeScript, Node 20, no runtime deps, file layout, recipient rules, demo, tests, build order). Do not redesign; if something in the plan is wrong, tell god.
>
> OUTPUT: repo with `npm start` (demo) and `npm test` (node:test) both working, README.md, AI_PROCESS.md (log your real prompts and steps as you go). Then push it to a NEW PUBLIC GitHub repo `globalli-notification-system` under the logged-in account. Reply with the repo URL, test output summary, and anything left open.
>
> TOOLS: git, npm, gh. Only dev deps (typescript, tsx, @types/node). The `Notification` class the PDF calls 'provided' is missing: write your own per the plan and note it in README.
>
> BOUNDARIES: in scope = plan sections 3-7. Optional WebSocket stretch only if everything else is done and green. Done = fresh clone -> npm install -> npm start -> npm test all pass, repo pushed and public.

Steps, in order:
1. Re-read the PDF to check the plan against it (exact example messages, the four trigger calls).
2. Scaffolded `package.json` (`start` = `tsx src/demo.ts`, `test` = `node --import tsx --test ...`), `tsconfig.json` (strict), `.gitignore`; installed the three dev dependencies.
3. Wrote `events.ts`, `notification.ts`, `catalog.ts`, then `templates.ts`, `preferences.ts`, `channels.ts`, then `notificationService.ts` and `producers.ts`, following the plan's file table.
4. `tsc --noEmit` passed on the first run.
5. Wrote `demo.ts` and ran `npm start`; checked every printed line against the PDF's example messages and the plan's recipient rules.
6. Wrote `test/notification.test.ts`: the four PDF triggers, type/category on the notification, preference off/on, rarity filter, a throwing channel. `npm test`: 5 of 5 pass.
7. Wrote README and this file; fresh-clone check; pushed.

## What went wrong and how it was fixed

- **Shell quoting.** The first attempt wrote all source files through one shell heredoc command; it failed to parse (apostrophes in strings like `You've`). Fixed by writing each file with the editor tool instead. No code impact.
- **`@types/node` version.** `npm install -D @types/node` pulled the newest major (26), while the project targets Node 20. Pinned to `^20` so the types match the `engines` field; re-ran the type check.
- **npm 12 install-script warning.** npm 12 does not run dependency install scripts by default, so it warned about `esbuild`'s postinstall. `tsx` still worked because esbuild ships its binary as an optional platform package. Checked by running `npm start` and `npm test` after a clean install.

## Design choices made with the AI (and kept)

- Template table typed as a mapped type over the event union, so a new event type without a template is a compile error. Chosen in the plan over a `switch`, which would spread one concern over the code.
- `handle()` returns an `Outcome` (`sent` / `skipped` with a reason), which makes the demo output and the tests straightforward.
- The demo subscribes a second, independent listener (an event logger) to the bus, to show the publish/subscribe point in practice.

## How the result was checked

- `tsc --noEmit` with `strict: true`.
- `npm start` output read line by line against the PDF examples.
- `npm test`: 5 tests, all passing.
- Fresh clone of the pushed repo → `npm install` → `npm start` → `npm test`.
