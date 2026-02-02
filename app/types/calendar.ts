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
  subreddits: string[];
  queries: string[];
  postsPerWeek: number;
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
