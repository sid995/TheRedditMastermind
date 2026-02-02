export interface CompanyInfo {
  name: string;
  website?: string;
  description?: string;
  goal?: string;
}

export interface Persona {
  id: string;
  name: string;
  description?: string;
}

export interface Config {
  company: CompanyInfo;
  personas: Persona[];
  subreddits: string[];
  queries: string[];
  postsPerWeek: number;
}

export interface ReplyAssignment {
  personaId: string;
  order?: number; // 1 = first reply, 2 = second reply
}

export interface CalendarItem {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  subreddit: string;
  query: string;
  authorPersonaId: string;
  replyAssignments: ReplyAssignment[];
}

export interface ContentCalendar {
  weekStart: Date;
  items: CalendarItem[];
}
