# Elevateoco CRM

Hierarchy, projects, tasks, approvals — built for Elevateoco. Light, calm, Apple-style UI on top of a strict approval-gated workflow.

## Stack

- Next.js 15 (App Router, React Server Components, Server Actions)
- TypeScript + Tailwind v4
- Local JSON-file database (swappable for Supabase post-launch)
- Zod for input validation
- Radix UI primitives

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The local database initialises on the first request — no Supabase, no Docker, no env vars needed.

## Seeded accounts

The full core roster is created automatically on first boot. Every account uses the placeholder password **`ChangeMe123!`** except Hazem, whose password is preset.

| Person | Role | Division | Reports to | Email | Password |
|---|---|---|---|---|---|
| Allan Chan | Owner (CEO) | Admin | — | `allan.chan@elevateoco.com` | `ChangeMe123!` |
| Hazem Dweik | Owner | Admin | — | `hazem.dweik@elevateoco.com` | `OkazakiFuhrer123@` |
| Roy Neven | Executive (Sales Owner) | Sales | Allan | `roy.neven@elevateoco.com` | `ChangeMe123!` |
| Arnis | Executive (CTO) | Technology | Allan | `arnis@elevateoco.com` | `ChangeMe123!` |
| Thomas Charrier | Lead (Sales Manager) | Sales | Roy | `thomas.charrier@elevateoco.com` | `ChangeMe123!` |
| Zuri Robledo | Lead | Sales | Roy | `zuri.robledo@elevateoco.com` | `ChangeMe123!` |
| Lachie | Lead | Sales | Roy | `lachie@elevateoco.com` | `ChangeMe123!` |
| Lewis Hayward | Lead | Sales | Roy | `lewis.hayward@elevateoco.com` | `ChangeMe123!` |
| Nathan | Member | Sales | Thomas | `nathan@elevateoco.com` | `ChangeMe123!` |
| Bailey | Lead (Squad Leader) | Marketing | Hazem | `bailey@elevateoco.com` | `ChangeMe123!` |
| Emil Larsen | Member | Marketing | Hazem | `emil.larsen@elevateoco.com` | `ChangeMe123!` |
| Julian | Lead | E-commerce | Hazem | `julian@elevateoco.com` | `ChangeMe123!` |
| Jeison | Member | Technology | Arnis | `jeison@elevateoco.com` | `ChangeMe123!` |
| Tanzeel Ahmad | Member | Technology | Arnis | `tanzeel.ahmad@elevateoco.com` | `ChangeMe123!` |
| Chase Buchanan | Member | Technology | Arnis | `chase.buchanan@elevateoco.com` | `ChangeMe123!` |
| Callum | Member | Technology | Arnis | `callum@elevateoco.com` | `ChangeMe123!` |

Division ownership: Allan → admin (CEO), Hazem → admin / marketing / e-commerce / people, Roy → sales, Arnis → technology.

Externals, reservists, partners, and candidates from the hierarchy are intentionally **not** seeded — only the core team.

## Where the data lives

```
.data/elevateoco.json    # gitignored, contains all rows + sessions
```

Delete the file to start over — the seed runs again on next request. To reset programmatically:

```ts
import { resetStore } from '@/lib/local/store';
resetStore();
```

## Architecture

```
COMPANY → DIVISIONS → CLIENTS → PROJECTS → TASKS → APPROVALS
                                              └── COMMENTS, ACTIVITY, NOTIFICATIONS
```

- **Divisions** — Sales, Marketing, Technology, E-commerce, Admin.
- **Users** — Each has a `role`, `division_id`, and `manager_id`. The manager chain drives task authority.
- **Clients** — Account-level records with primary division and account lead.
- **Projects** — Belong to a client, owned by a division, led by a single person.
- **Tasks** — Live inside projects. Have an assignee and an optional reviewer. **A task with a reviewer cannot transition to `done` without an approved approval row** — enforced in `submitForReview` + `decideApproval` server actions.
- **Approvals** — Submitting for review creates a pending approval; the reviewer approves or rejects, which transitions the task.

## File map

```
src/app/
  (auth)/login, signup     — auth pages + server actions
  app/                     — authed shell; layout enforces session
    page.tsx               — dashboard (approvals + my tasks + activity)
    approvals/             — review queue
    tasks/                 — list, board, detail, comments, approval flow
    projects/              — list + detail (board view of tasks)
    clients/               — list + detail
    divisions/[code]/      — per-division view
    people/                — roster
    admin/                 — owner + admin-division only
    inbox/                 — notifications
    settings/              — profile

src/lib/local/             — local JSON-file DB + Supabase-shaped facade
  store.ts                 — load/save + seed
  query.ts                 — chainable query builder (.eq, .in, .order, .single, ...)
  auth.ts                  — cookie-backed sessions, signIn / signUp / signOut
  hash.ts                  — pbkdf2 password hashing
  client.ts                — assembled Supabase-compatible client

supabase/migrations/       — Postgres schema + RLS (for post-launch Supabase)
```

## Moving to Supabase (post-launch)

When ready, swap `src/lib/supabase/server.ts` back to the real `@supabase/ssr` client and apply `supabase/migrations/0001_init.sql`. The Postgres schema mirrors the local store, so the rest of the app keeps working untouched.

## Commands

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve production build
```
