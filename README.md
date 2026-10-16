# Samator Cylinder Tracker

Internal web app for tracking the lifecycle of Samator's gas cylinders (Empty → Filled → Delivered → ... → Retired), replacing manual Excel/paper tracking. Built for the Samator Group technical assignment.

**Stack**: ASP.NET Core Web API (.NET 8) + EF Core + SQLite (backend) · Next.js (App Router, TypeScript, Tailwind) (frontend).

```
samator-test/
  backend/     ASP.NET Core Web API, EF Core, SQLite
  frontend/    Next.js app
  cylinders.json   the 87-record seed data provided with the assignment
```

---

## Quick start (for the team)

You need both the backend and frontend running at the same time, in two terminals.

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Node.js 18+ and npm

### 1. Backend — terminal 1
```bash
cd backend
dotnet run --project src/Samator.CylinderTracker.Api
```
Wait for `Now listening on: http://localhost:5199`. On first run this automatically applies EF Core migrations and seeds the SQLite database from `cylinders.json` (87 records) — nothing else to set up. Swagger UI: `http://localhost:5199/swagger`.

### 2. Frontend — terminal 2
```bash
cd frontend
cp .env.example .env.local   # only needed once; default already points at the backend above
npm install
npm run dev
```
Open **http://localhost:3000**.

> Order matters the first time only insofar as the frontend will show a connection error if you open it before the backend has finished starting — just refresh once the backend log shows "Now listening".

### Running the tests
```bash
# backend — 20 xUnit integration tests
cd backend && dotnet test

# frontend — 5 Jest + React Testing Library tests
cd frontend && npm test
```

### Postman
`backend/Samator.CylinderTracker.postman_collection.json` — import directly into Postman (File → Import) for a ready-made set of requests covering every endpoint, including the 400/404/409 edge cases.

---

## What's implemented

**Backend API** (exactly per the assignment's recommended routes, no deviations):

| Method & route | Behavior |
|---|---|
| `GET /api/cylinders?search=&status=&page=&pageSize=` | Paged, filtered, searched list — `{ items, page, pageSize, totalCount }` |
| `GET /api/cylinders/{id}` | Single cylinder or 404 |
| `POST /api/cylinders` | Create (status defaults to `Empty`, no customer); 409 on duplicate serial |
| `PUT /api/cylinders/{id}` | Edit serial/gas type only (status not editable here) |
| `POST /api/cylinders/{id}/status` | Change status (`customerName` required when moving to `Delivered`); enforces the full status transition map |

**Frontend** (per the assignment's Front End Requirements):
1. List page — debounced search (serial number or customer name, case-insensitive, Unicode-aware), status filter, pagination, all wired to the API's query params.
2. Create / Edit form — client-side validation (zod) plus a confirmation dialog before the request fires.
3. Status change — a dropdown that only offers valid next statuses for the cylinder's current state, with a required customer-name field when moving to `Delivered`, also behind a confirmation dialog.
4. Loading / empty / error states on every data-fetching screen.
5. Server validation errors (400/409/404) surfaced in a popup, including field-level messages.

---

## Key design decisions

- **Deviation: Next.js instead of plain React (CRA/Vite).** The assignment says "Frontend: React" — Next.js *is* React (every component here is a plain React component/hook), just with a file-based router and build tooling bundled in, chosen to scaffold routing/TypeScript/Tailwind in one step. No React-specific requirement is affected.
- **`gasType` and `status` are validated strings, not C# enums**, because `gasType` includes `"Carbon Dioxide"` (a value with a space) — plain strings validated against a fixed allow-list avoid needing a custom JSON converter while staying equally strict.
- **Search is applied in-memory on the backend**, after the DB-level status filter. SQLite's default `LIKE`/`NOCASE` only case-folds ASCII `a-z`, so a naive SQL `LIKE` would miss matches against the Unicode names in the seed data (`Östara`, `D'Amico`). Matching in C# with `OrdinalIgnoreCase` trades a bit of DB-level efficiency for correctness on exactly the "dirty data" the assignment calls out — verified by searching `östara` (plain lowercase) and getting correct matches.
- **`customerName` is server-enforced, not just validated** — it's forced back to `null` whenever the target status isn't `Delivered`, maintaining that invariant server-side rather than rejecting the request.
- **Real EF Core migrations** (not `EnsureCreated()`), applied automatically on startup.
- **Status transition rules are duplicated client-side** (`frontend/lib/statusTransitions.ts`) purely so the UI can hide invalid choices up front — a UX convenience; the backend independently re-validates every transition and remains the source of truth.
- **Confirmation dialogs, not native `confirm()`**, implement the "validasi window" requirement.
- **A single `CylinderForm` component serves both create and edit** (`mode` prop), since the two forms share identical fields/validation.

## Assumptions (instructions that were underspecified)

- **`id` is not actually present in the provided `cylinders.json`**, even though the assignment states it should be. Assumption: ids are DB-generated (SQLite autoincrement), assigned in the same order as the JSON array during seeding.
- **`pageSize` below 1** is treated as a 400, even though the assignment text only explicitly calls out "above 50" as invalid — symmetrical validation felt safer than allowing a nonsensical value through.
- **An unrecognized `status` value in the list filter** returns 400, consistent with how `page`/`pageSize` are validated, though not explicitly specified.
- **`gasType` matching is exact-string, case-sensitive**, against the 6 listed values (including `"Carbon Dioxide"` with a space).
- No UI copy/layout was specified, so reasonable defaults were chosen (table-based list, inline per-row status menu, fixed page size of 10 with Previous/Next controls) favoring clarity given the time budget.

## What we'd do with more time

- Move search to a real DB-level/search-index query so it scales past the in-memory tradeoff above — relevant given the problem statement mentions "ribuan tabung".
- Add an audit trail (who/when changed what) — the business problem explicitly cites accountability/traceability as pain points.
- Add authentication/authorization — this is an *internal* tool but currently has none.
- Add CSV/Excel export to address the "Slow Analysis" pain point from the problem background.
- URL-sync the list page's search/status/page state so links are shareable.
- Add Playwright E2E tests covering full browser flows — the development environment didn't have a working browser automation tool, so the UI was verified via unit/integration tests plus manual API checks, not an actual click-through. **Do a manual pass through the app before submitting.**
- Deploy backend + frontend to a free cloud provider (Render/Fly.io + Vercel) — nice-to-have in the assignment.

## AI usage

This project was built with **Claude Code** (Claude Sonnet 5) end-to-end: architecture planning, the full ASP.NET Core/EF Core/SQLite backend, the Next.js/React frontend, and both test suites. All code was compiled, both test suites were run (20 backend xUnit tests, 5 frontend Jest tests — all green), and the API was exercised directly via `curl`/Postman to verify CORS, duplicate-serial (409), invalid-transition (400), the 120-character `customerName` boundary, and Unicode search behavior end-to-end. The frontend was also typechecked, linted, and built for production during the session. The development environment did not have a working browser automation tool available, so a manual click-through of the UI was **not** performed as part of this session — do a quick manual pass before submitting.
