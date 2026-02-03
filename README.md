# Reddit Mastermind

A **Reddit content calendar planner** that helps you plan posts and reply assignments across subreddits and team members (personas). Define your company, people, subreddits, and ChatGPT-style queries; generate a balanced week plan; then edit, duplicate, export, or revisit past weeks—all in one place.

---

## What it does

- **Configuration** — Enter company info, **people** (authors/personas), **subreddits**, and **ChatGPT queries**. Set how many posts per week you want.
- **Calendar generation** — A deterministic planning algorithm distributes posts across the week, assigns an author and 1–2 reply people per post, and respects limits (e.g. max posts per subreddit, max uses per query).
- **Week view** — See the current week in a 7‑day grid. Each post shows subreddit, query, author, and reply people.
- **Edit & delete** — Change subreddit, query, day, author, or replies per post; or delete a post from the calendar.
- **Templates** — Save the current configuration by name and load it later (e.g. “Q1 campaign”, “Product launch”).
- **History** — Past weeks are stored locally. Reopen any week in the planner or export it.
- **Calendar page** — Month and week views of all events from current and historical calendars; click an event for details and “Open week in planner”.
- **Export** — Download the calendar as **Excel**, **CSV**, or **JSON**.
- **Themes** — Light, Dark, System, and Sepia.
- **Mobile-friendly** — Layout and controls are responsive and touch-friendly.

No Reddit API or live posting: this app is for **planning** content and reply assignments only.

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS**, **shadcn/ui** (Radix primitives), **lucide-react**
- **next-themes** (theme switching), **sonner** (toasts)
- **xlsx** for Excel export
- **Vitest** for unit tests (planning algorithm)
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

Open [http://localhost:3000](http://localhost:3000). The first visit shows a short onboarding overlay; you can reopen it from the Help button in the header.

### Other commands

```bash
pnpm build    # Production build
pnpm start    # Run production server
pnpm test     # Run tests (Vitest)
pnpm lint     # ESLint
```

---

## Project structure

```
app/
  page.tsx              # Home: config form + calendar week view
  calendar/page.tsx     # Calendar: month/week views of all events
  components/          # App-specific UI
    AppHeader.tsx
    ConfigForm.tsx
    ConfigTemplatePicker.tsx
    CalendarWeekView.tsx
    CalendarItemCard.tsx
    CalendarItemEditDialog.tsx
    CalendarHistoryPanel.tsx
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
  calendar-events.ts       # Aggregate events for calendar page
  config-templates.ts     # Save/load config by name
  excel-io.ts             # Excel, CSV, JSON export
  calendar-quality.ts     # Optional quality metrics
components/
  ui/                  # shadcn/ui components
  theme-picker.tsx
  theme-provider.tsx
```

---

## Data model

- **Config** — Company (name, website, description, goal), **people** (id, name, description), subreddits and queries as raw text (newline or comma separated), and posts per week.
- **Person** — Represents an author or reply persona. Each calendar post has one author and 0–2 reply people (different from the author).
- **CalendarItem** — One planned post: `dayOfWeek` (0 = Sunday … 6 = Saturday), `subreddit`, `query`, `authorPersonId`, `replyAssignments` (personId + order).
- **ContentCalendar** — `weekStart` (Monday 00:00) and `items[]`.

The planner uses **Monday as the start of the week** for generation; the UI shows days Sunday–Saturday.

---

## How the planner works

1. You submit the **configuration** (company, people, subreddits, queries, posts per week).
2. **generateCalendar(config, weekStart)**:
   - Uses a **seeded RNG** (week start timestamp) so the same inputs produce the same calendar.
   - Distributes the requested number of posts across the seven days.
   - For each post: picks a subreddit (max 3 posts per subreddit), a query (max 2 uses per query), one author, and 1–2 reply people (excluding the author), with simple balancing so no person is overused.
3. The resulting **ContentCalendar** is shown in the week view, saved to **localStorage** as the “current” calendar, and appended to **calendar history**.

You can then **edit** any post (subreddit, query, day, author, replies), **delete** a post, **duplicate** the week to the next week, or **generate next week** with the current config. The current calendar is persisted automatically; history is stored separately and used for the Calendar page and exports.

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

The planning algorithm is covered by unit tests:

```bash
pnpm test
```

Tests check distribution, author/reply constraints, subreddit and query caps, and deterministic regeneration.

---

## Deploy

Build and run in production:

```bash
pnpm build
pnpm start
```

You can deploy to **Vercel**, **Netlify**, or any Node host that supports Next.js. No environment variables are required for basic use.
