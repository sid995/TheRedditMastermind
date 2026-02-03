import type { Config } from "@/app/types/calendar";

/** Subreddit format: r/name or plain name (letters, numbers, underscores). */
const SUBREDDIT_PATTERN = /^r\/[\w+]+$|^[\w+]+$/;

function parseList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate config for calendar generation.
 * Errors block submit; warnings are shown but do not block.
 */
export function validateConfig(config: Config): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { company, people, subreddits, queries, postsPerWeek } = config;

  if (!company.name.trim()) {
    errors.push("Company name is required.");
  }

  if (people.length < 2) {
    errors.push("At least 2 people are required.");
  } else if (people.length === 2) {
    warnings.push("Only 2 people: reply options will be limited (1 per post).");
  }

  const missingNames = people.filter((p) => !p.name.trim());
  if (missingNames.length > 0) {
    errors.push("Every person must have a name.");
  }

  const subredditList = parseList(subreddits);
  if (subredditList.length === 0) {
    errors.push("At least one subreddit is required.");
  } else {
    const invalid = subredditList.filter((s) => !SUBREDDIT_PATTERN.test(s));
    if (invalid.length > 0) {
      errors.push(`Invalid subreddit format: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}. Use r/name or name.`);
    }
  }

  const queryList = parseList(queries);
  if (queryList.length === 0) {
    errors.push("At least one query is required.");
  } else {
    const lower = queryList.map((q) => q.toLowerCase());
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const q of lower) {
      if (seen.has(q)) duplicates.push(q);
      seen.add(q);
    }
    if (duplicates.length > 0) {
      warnings.push(`Duplicate queries: ${[...new Set(duplicates)].slice(0, 2).join(", ")}${duplicates.length > 2 ? "…" : ""}.`);
    }
    const singleWord = queryList.filter((q) => q.split(/\s+/).length === 1);
    if (queryList.length > 0 && singleWord.length === queryList.length) {
      warnings.push("All queries are single words. Consider longer prompts for better variety.");
    }
  }

  if (postsPerWeek < 1 || postsPerWeek > 50) {
    errors.push("Posts per week must be between 1 and 50.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
