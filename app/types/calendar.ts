export interface CompanyInfo {
  name: string;
  website?: string;
  description?: string;
  goal?: string;
}

export interface Person {
  id: string;
  name: string;
  description?: string;
}

export interface Config {
  company: CompanyInfo;
  people: Person[];
  /** Raw text: newline- or comma-separated subreddits */
  subreddits: string;
  /** Raw text: newline- or comma-separated ChatGPT queries */
  queries: string;
  postsPerWeek: number;
  /** Optional: prefer these days (0=Sun..6=Sat). If set, posts are distributed only across these days. */
  preferredDays?: number[];
  /** Max posts per subreddit per week (default 3) */
  maxPostsPerSubreddit?: number;
  /** Max uses per query per week (default 2) */
  maxUsesPerQuery?: number;
  /** Optional: for each query, list of subreddits that query can be posted to. Empty or missing = all subreddits. */
  querySubredditRules?: { query: string; subreddits: string[] }[];
}

export interface ReplyAssignment {
  personId: string;
  order?: number; // 1 = first reply, 2 = second reply
}

export interface CalendarItem {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  subreddit: string;
  query: string;
  authorPersonId: string;
  replyAssignments: ReplyAssignment[];
}

export interface ContentCalendar {
  weekStart: Date;
  items: CalendarItem[];
}
