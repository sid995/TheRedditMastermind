import type { ContentCalendar, Config } from "@/app/types/calendar";

const MAX_POSTS_PER_SUBREDDIT = 3;
const MAX_USES_PER_QUERY = 2;

export interface QualityScore {
  score: number; // 0–10
  breakdown: {
    subredditCap: number; // 0–1: no subreddit over cap
    queryDiversity: number; // 0–1: queries not overused
    authorBalance: number; // 0–1: authors distributed
    replyBalance: number; // 0–1: reply persons distributed
    noSelfReply: number; // 0–1: author never in own replies
    daySpread: number; // 0–1: posts spread across days
  };
}

/**
 * Evaluate quality of a generated calendar (0–10).
 * Catches: overposting in a subreddit, overlapping topics, skewed persona usage, author replying to self, all posts on one day.
 */
export function evaluateCalendarQuality(
  calendar: ContentCalendar,
  config: Config
): QualityScore {
  const { items } = calendar;
  const personIds = new Set(config.people.map((p) => p.id));

  if (items.length === 0) {
    return {
      score: 0,
      breakdown: {
        subredditCap: 0,
        queryDiversity: 0,
        authorBalance: 0,
        replyBalance: 0,
        noSelfReply: 0,
        daySpread: 0,
      },
    };
  }

  const subredditCount: Record<string, number> = {};
  const queryCount: Record<string, number> = {};
  const authorCount: Record<string, number> = {};
  const replyCount: Record<string, number> = {};
  const dayCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  let selfReplyViolations = 0;

  for (const item of items) {
    subredditCount[item.subreddit] = (subredditCount[item.subreddit] ?? 0) + 1;
    queryCount[item.query] = (queryCount[item.query] ?? 0) + 1;
    authorCount[item.authorPersonId] = (authorCount[item.authorPersonId] ?? 0) + 1;
    dayCount[item.dayOfWeek] = (dayCount[item.dayOfWeek] ?? 0) + 1;

    for (const r of item.replyAssignments) {
      replyCount[r.personId] = (replyCount[r.personId] ?? 0) + 1;
      if (r.personId === item.authorPersonId) selfReplyViolations++;
    }
  }

  const subredditOverCap = Object.values(subredditCount).filter(
    (c) => c > MAX_POSTS_PER_SUBREDDIT
  ).length;
  const subredditCap = subredditOverCap === 0 ? 1 : 0;

  const queryOverCap = Object.values(queryCount).filter((c) => c > MAX_USES_PER_QUERY).length;
  const queryDiversity = queryOverCap === 0 ? 1 : 0;

  const authorCounts = Object.values(authorCount);
  const maxAuthor = Math.max(...authorCounts);
  const minAuthor = Math.min(...authorCounts);
  const authorBalance = authorCounts.length >= 2 && maxAuthor - minAuthor <= 2 ? 1 : Math.max(0, 1 - (maxAuthor - minAuthor) / items.length);

  const replyCounts = Object.values(replyCount);
  const replyBalance =
    replyCounts.length === 0
      ? 1
      : replyCounts.length >= 2
        ? Math.max(0, 1 - (Math.max(...replyCounts) - Math.min(...replyCounts)) / items.length)
        : 1;

  const noSelfReply = selfReplyViolations === 0 ? 1 : 0;

  const daysUsed = Object.values(dayCount).filter((c) => c > 0).length;
  const daySpread = daysUsed >= Math.min(3, items.length) ? 1 : daysUsed / 3;

  const breakdown = {
    subredditCap,
    queryDiversity,
    authorBalance,
    replyBalance,
    noSelfReply,
    daySpread,
  };

  const score =
    (breakdown.subredditCap +
      breakdown.queryDiversity +
      breakdown.authorBalance +
      breakdown.replyBalance +
      breakdown.noSelfReply +
      breakdown.daySpread) *
    (10 / 6);

  return { score: Math.round(score * 10) / 10, breakdown };
}
