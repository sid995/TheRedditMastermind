# Reddit Mastermind

A **Reddit content calendar planner** that helps you plan posts and reply assignments across subreddits and team members (personas). Define your company, people, subreddits, and ChatGPT-style queries; generate a balanced week plan; then edit, duplicate, export, or revisit past weeks—all in one place.

---

## What it does

- **Configuration:** Enter company info, **people** (authors/personas), **subreddits**, and **ChatGPT queries**. Set how many posts per week you want. **Validation** shows errors (e.g. invalid subreddit format, missing names) and optional warnings (duplicate queries, only 2 people).
- **Distribution:** Choose **preferred days** (e.g. weekdays only), **max posts per subreddit**, and **max uses per query** so the algorithm respects your caps. Optional **query–subreddit rules** restrict which subreddits each query can be posted to.
- **Calendar generation**: A deterministic planning algorithm distributes posts across the week (or preferred days), assigns an author and 1–2 reply people per post, and nudges the day spread so no day is overloaded. Same config + week gives the same calendar.
- **Quality score**: Each calendar shows a **0–10 quality score** with a breakdown (subreddit cap, query diversity, author/reply balance, no self-reply, day spread) and a short hint when score is low.
- **Week view**: See the current week in a 7‑day grid. Each post shows subreddit, query, author, and reply people.
- **Edit & delete**: Change subreddit, query, day, author, or replies per post; or delete a post from the calendar.
- **Templates:** Save the current configuration by name and load it later (e.g. “Q1 campaign”, “Product launch”).
- **History:** Past weeks are stored locally. Reopen any week in the planner or export it.
- **Calendar page**: Month and week views of all events from current and historical calendars; click an event for details and “Open week in planner”.
- **Campaign page**: 4‑week grid (one row per week, 7 day columns) so you can see the next month at a glance. Today / Prev 4 weeks / Next 4 weeks; click an event for details and “Open week in planner”.
- **Export**: Download the calendar as **Excel**, **CSV**, or **JSON**.
- **Themes**: Light, Dark, System, and Sepia.
- **Mobile-friendly**: Layout and controls are responsive and touch-friendly.

No Reddit API or live posting: this app is for **planning** content and reply assignments only.

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS**, **shadcn/ui** (Radix primitives), **lucide-react**
- **next-themes** (theme switching), **sonner** (toasts)
- **xlsx** for Excel export
- **Vitest** (unit + component tests), **jsdom**, **@testing-library/react**, **Playwright** (E2E)
- **pnpm** for package management

---

## Getting started

### Prerequisites

- Node.js 18+
- pnpm (or npm / yarn)

### Install and run

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The first visit shows a short onboarding overlay; you can reopen it from the Help button in the header. Use **Planner** (home), **Calendar** (month/week), and **Campaign** (4-week grid) in the header to switch views.

### Other commands

```bash
pnpm build     # Production build
pnpm start     # Run production server
pnpm test      # Unit + component tests (Vitest)
pnpm test:e2e  # E2E tests (Playwright; starts dev server, install browsers with: pnpm exec playwright install chromium)
pnpm lint      # ESLint
```

---

## Project structure

```
app/
  page.tsx              # Home: config form + calendar week view
  calendar/page.tsx    # Calendar: month/week views of all events
  campaign/page.tsx    # Campaign: 4-week grid view
  components/          # App-specific UI
    AppHeader.tsx
    ConfigForm.tsx
    ConfigTemplatePicker.tsx
    CalendarWeekView.tsx
    CalendarItemCard.tsx
    CalendarItemEditDialog.tsx
    CalendarHistoryPanel.tsx
    CalendarQualityBadge.tsx
    OnboardingDialog.tsx
    calendar-constants.ts
  contexts/
    OnboardingContext.tsx
  types/
    calendar.ts        # Config, Person, CalendarItem, ContentCalendar, etc.
lib/
  planning-algorithm.ts   # generateCalendar, duplicateCalendarToWeek, getWeekStart
  planning-algorithm.test.ts
  calendar-history.ts     # localStorage history of past weeks
  calendar-events.ts      # Aggregate events for calendar + campaign
  calendar-quality.ts     # evaluateCalendarQuality (0–10 + breakdown)
  config-templates.ts     # Save/load config by name
  config-validation.ts    # validateConfig (errors + warnings)
  excel-io.ts             # Excel, CSV, JSON export
components/
  ui/                    # shadcn/ui components
  theme-picker.tsx
  theme-provider.tsx
e2e/
  home.spec.ts           # Playwright E2E (config form, full generate flow)
```

---

## Data model

- **Config** — Company (name, website, description, goal), **people** (id, name, description), subreddits and queries as raw text (newline or comma separated), posts per week, optional **preferredDays** (0–6), **maxPostsPerSubreddit**, **maxUsesPerQuery**, and **querySubredditRules** (query → allowed subreddits).
- **Person** — Represents an author or reply persona. Each calendar post has one author and 0–2 reply people (different from the author).
- **CalendarItem** — One planned post: `dayOfWeek` (0 = Sunday … 6 = Saturday), `subreddit`, `query`, `authorPersonId`, `replyAssignments` (personId + order).
- **ContentCalendar** — `weekStart` (Monday 00:00) and `items[]`.

The planner uses **Monday as the start of the week** for generation; the UI shows days Sunday–Saturday.

---

## How the planner works

1. You submit the **configuration** (company, people, subreddits, queries, posts per week, optional distribution and query–subreddit rules). **Config validation** blocks submit on errors and shows warnings.
2. **generateCalendar(config, weekStart)**:
   - Uses a **seeded RNG** (week start timestamp) so the same inputs produce the same calendar.
   - Distributes the requested number of posts across **preferred days** (or all 7 if none set), then **nudges** the day spread so empty days get at least one post when possible.
   - For each post: picks a query (respecting max uses per query), then a subreddit (respecting **query–subreddit rules** if set, and max posts per subreddit from config or default 3), one author, and 1–2 reply people (excluding the author), with balancing so no person is overused.
3. The resulting **ContentCalendar** is shown in the week view with a **quality score** (0–10 and breakdown), saved to **localStorage** as the “current” calendar, and appended to **calendar history**. The view scrolls to the calendar after generate.

You can then **edit** any post (subreddit, query, day, author, replies), **delete** a post, **duplicate** the week to the next week, or **generate next week** with the current config. The current calendar is persisted automatically; history is stored separately and used for the Calendar and Campaign pages and exports.

---

## Persistence

- **Current calendar** — Stored in `localStorage` under `reddit-mastermind-calendar`. Updates on every change (edit, delete, generate, duplicate).
- **Calendar history** — Last 30 weeks in `localStorage` under `reddit-mastermind-calendar-history`. Used for the history panel and the Calendar page.
- **Config templates** — Saved by name in `localStorage`; managed via Save/Load template in the config card.
- **Theme** — Persisted by next-themes (e.g. in localStorage/cookie depending on setup).

No backend or database: everything is client-side.

---

## Keyboard shortcut

- **Ctrl+Enter** (or Cmd+Enter on Mac) in the configuration form submits and generates the calendar.

---

## Testing

- **Unit tests (Vitest)** — Planning algorithm (`lib/planning-algorithm.test.ts`), calendar history, config templates, calendar events aggregation, Excel/CSV/JSON export (`lib/*.test.ts`). Uses **jsdom** for `localStorage` in history/templates/events tests.
- **Component tests** — `app/components/ConfigForm.test.tsx` (render, validation, `onChange`/submit state) with **@testing-library/react** and **@testing-library/jest-dom**.
- **E2E (Playwright)** — `e2e/home.spec.ts`: home page loads and shows the config form; full flow (fill config → generate → see week view). Run `pnpm test:e2e` (starts dev server automatically). Install browsers once: `pnpm exec playwright install chromium`.

```bash
pnpm test      # Run all Vitest tests (54+)
pnpm test:e2e  # Run Playwright E2E (2 tests)
```

Unit tests cover distribution, author/reply constraints, subreddit and query caps, determinism, persistence, and export output shape.

---

## Deploy

Build and run in production:

```bash
pnpm build
pnpm start
```

You can deploy to **Vercel**, **Netlify**, or any Node host that supports Next.js. No environment variables are required for basic use.
