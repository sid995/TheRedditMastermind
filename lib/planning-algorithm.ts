import type { Config, ContentCalendar, CalendarItem, ReplyAssignment } from "@/app/types/calendar";

/** Seeded RNG (mulberry32) for deterministic calendar generation */
function seededRandom(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MAX_POSTS_PER_SUBREDDIT = 3;
const MAX_USES_PER_QUERY = 2;
const REPLIES_PER_POST_MIN = 1;
const REPLIES_PER_POST_MAX = 2;

/** Get Monday 00:00 of the week containing date */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Get the next week start (Monday) after the given week start */
export function getNextWeekStart(weekStart: Date): Date {
  const next = new Date(weekStart);
  next.setDate(next.getDate() + 7);
  return next;
}

/** Generate a content calendar for the given week */
export function generateCalendar(config: Config, weekStart: Date): ContentCalendar {
  const seed = getWeekStart(new Date(weekStart)).getTime();
  const rng = seededRandom(seed);

  const { company, personas, subreddits, queries, postsPerWeek } = config;
  if (personas.length < 2) throw new Error("At least 2 personas required");
  if (subreddits.length === 0) throw new Error("At least 1 subreddit required");
  if (queries.length === 0) throw new Error("At least 1 query required");
  if (postsPerWeek < 1) throw new Error("postsPerWeek must be at least 1");

  const n = Math.min(postsPerWeek, 7 * 3); // sane cap
  const items: CalendarItem[] = [];

  const subredditCount: Record<string, number> = Object.fromEntries(subreddits.map((s) => [s, 0]));
  const queryCount: Record<string, number> = Object.fromEntries(queries.map((q) => [q, 0]));
  const personaAuthorCount: Record<string, number> = Object.fromEntries(personas.map((p) => [p.id, 0]));
  const personaReplyCount: Record<string, number> = Object.fromEntries(personas.map((p) => [p.id, 0]));

  /** Pick one from array, preferring indices with lower counts; countKey is key in countRecord */
  function pickWithBalance<T>(
    arr: T[],
    countRecord: Record<string, number>,
    getKey: (t: T) => string
  ): T {
    const keys = arr.map(getKey);
    const minCount = Math.min(...keys.map((k) => countRecord[k] ?? 0));
    const candidates = arr.filter((_, i) => (countRecord[getKey(arr[i])] ?? 0) <= minCount + 1);
    return candidates[Math.floor(rng() * candidates.length)];
  }

  /** Shuffle array (Fisher–Yates) using rng */
  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // 1) Distribute n posts across 7 days (1 = Monday, 7 = Sunday; we use 0 = Monday for internal)
  const days: number[] = [];
  for (let i = 0; i < n; i++) {
    days.push(Math.floor(rng() * 7)); // 0..6 = Mon..Sun
  }
  days.sort((a, b) => a - b);

  for (let i = 0; i < n; i++) {
    const dayOfWeek = days[i];

    // Subreddit: cap per subreddit
    const allowedSubreddits = subreddits.filter((s) => (subredditCount[s] ?? 0) < MAX_POSTS_PER_SUBREDDIT);
    if (allowedSubreddits.length === 0) break;
    const subreddit = pickWithBalance(allowedSubreddits, subredditCount, (s) => s);
    subredditCount[subreddit] = (subredditCount[subreddit] ?? 0) + 1;

    // Query: diversify
    const allowedQueries = queries.filter((q) => (queryCount[q] ?? 0) < MAX_USES_PER_QUERY);
    const query = allowedQueries.length > 0
      ? pickWithBalance(allowedQueries, queryCount, (q) => q)
      : queries[Math.floor(rng() * queries.length)];
    queryCount[query] = (queryCount[query] ?? 0) + 1;

    // Author persona: balance
    const author = pickWithBalance(personas, personaAuthorCount, (p) => p.id);
    personaAuthorCount[author.id] = (personaAuthorCount[author.id] ?? 0) + 1;

    // Reply personas: 1–2 others, with order
    const others = personas.filter((p) => p.id !== author.id);
    const numReplies = Math.min(
      REPLIES_PER_POST_MAX,
      others.length,
      Math.max(REPLIES_PER_POST_MIN, Math.floor(rng() * 2) + 1)
    );
    const replyPersonas = shuffle(others)
      .slice(0, numReplies)
      .sort((a, b) => (personaReplyCount[a.id] ?? 0) - (personaReplyCount[b.id] ?? 0));
    const replyAssignments: ReplyAssignment[] = replyPersonas.map((p, idx) => ({
      personaId: p.id,
      order: idx + 1,
    }));
    replyPersonas.forEach((p) => {
      personaReplyCount[p.id] = (personaReplyCount[p.id] ?? 0) + 1;
    });

    items.push({
      id: `item-${weekStart.getTime()}-${i}`,
      dayOfWeek,
      subreddit,
      query,
      authorPersonaId: author.id,
      replyAssignments,
    });
  }

  return {
    weekStart: getWeekStart(new Date(weekStart)),
    items,
  };
}
