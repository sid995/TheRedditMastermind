"use client";

import type { Config, CompanyInfo, Person } from "@/app/types/calendar";
import { DAY_NAMES } from "./calendar-constants";
import { validateConfig } from "@/lib/config-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";

function defaultPerson(id: string): Person {
  return { id, name: "", description: "" };
}

function parseList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface ConfigFormProps {
  config: Config;
  onChange: (config: Config) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function ConfigForm({ config, onChange, onSubmit, disabled, isGenerating }: ConfigFormProps) {
  const { company, people, subreddits, queries, postsPerWeek, preferredDays, maxPostsPerSubreddit, maxUsesPerQuery, querySubredditRules } = config;

  const setCompany = (c: Partial<CompanyInfo>) => {
    onChange({ ...config, company: { ...company, ...c } });
  };

  const setPeople = (p: Person[]) => {
    onChange({ ...config, people: p });
  };

  const addPerson = () => {
    const id = `person-${Date.now()}`;
    setPeople([...people, defaultPerson(id)]);
  };

  const removePerson = (id: string) => {
    if (people.length <= 2) return;
    setPeople(people.filter((p) => p.id !== id));
  };

  const updatePerson = (id: string, updates: Partial<Person>) => {
    setPeople(
      people.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const setSubreddits = (text: string) => {
    onChange({ ...config, subreddits: text });
  };

  const setQueries = (text: string) => {
    onChange({ ...config, queries: text });
  };

  const setPostsPerWeek = (n: number) => {
    onChange({ ...config, postsPerWeek: Math.max(1, Math.min(50, n)) });
  };

  const effectivePreferredDays = preferredDays?.length ? preferredDays : ALL_DAYS;
  const setPreferredDay = (day: number, checked: boolean) => {
    const current = effectivePreferredDays.filter((d) => d !== day);
    const next = checked ? [...current, day].sort((a, b) => a - b) : current;
    onChange({ ...config, preferredDays: next.length === 7 ? undefined : next });
  };
  const setMaxPostsPerSubreddit = (n: number) => {
    const v = Math.max(1, Math.min(10, n));
    onChange({ ...config, maxPostsPerSubreddit: v === 3 ? undefined : v });
  };
  const setMaxUsesPerQuery = (n: number) => {
    const v = Math.max(1, Math.min(10, n));
    onChange({ ...config, maxUsesPerQuery: v === 2 ? undefined : v });
  };

  const queryList = parseList(queries);
  const subredditList = parseList(subreddits);
  const setQuerySubredditRule = (query: string, subredditsForQuery: string[]) => {
    const rules = config.querySubredditRules ?? [];
    const rest = rules.filter((r) => r.query !== query);
    const next = subredditsForQuery.length === 0 ? rest : [...rest, { query, subreddits: subredditsForQuery }];
    onChange({ ...config, querySubredditRules: next.length === 0 ? undefined : next });
  };
  const getRuleSubreddits = (query: string): string => {
    const rule = (querySubredditRules ?? []).find((r) => r.query === query);
    return rule?.subreddits?.join(", ") ?? "";
  };

  const validation = validateConfig(config);
  const valid = validation.valid;

  return (
    <form
      className="flex flex-col gap-4 sm:gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit();
      }}
    >
      <Card>
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-2">
          <CardTitle className="text-lg">Company</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid gap-2">
            <Label htmlFor="company-name">Company name</Label>
            <Input
              id="company-name"
              type="text"
              placeholder="Company name"
              value={company.name}
              onChange={(e) => setCompany({ name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-website">Website (optional)</Label>
            <Input
              id="company-website"
              type="text"
              placeholder="https://..."
              value={company.website ?? ""}
              onChange={(e) => setCompany({ website: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-description">Description (optional)</Label>
            <Input
              id="company-description"
              type="text"
              placeholder="Short description"
              value={company.description ?? ""}
              onChange={(e) => setCompany({ description: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company-goal">Goal (optional)</Label>
            <Input
              id="company-goal"
              type="text"
              placeholder="Business goal"
              value={company.goal ?? ""}
              onChange={(e) => setCompany({ goal: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 pt-4 sm:px-6 sm:pt-6 pb-2">
          <CardTitle className="text-lg">People (min 2)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addPerson} className="min-h-[44px] w-full sm:w-auto touch-manipulation">
            <UserPlus className="size-4" />
            Add person
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 pb-4 sm:px-6 sm:pb-6">
          {people.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-4 px-4 pb-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="grid gap-2 flex-1 min-w-0">
                  <Label htmlFor={`person-name-${p.id}`}>Name</Label>
                  <Input
                    id={`person-name-${p.id}`}
                    type="text"
                    placeholder="Person name"
                    value={p.name}
                    onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
                <div className="grid gap-2 flex-1 min-w-0">
                  <Label htmlFor={`person-desc-${p.id}`}>Description (optional)</Label>
                  <Input
                    id={`person-desc-${p.id}`}
                    type="text"
                    placeholder="Role or bio"
                    value={p.description ?? ""}
                    onChange={(e) => updatePerson(p.id, { description: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removePerson(p.id)}
                  disabled={people.length <= 2}
                  className="min-h-[44px] touch-manipulation w-full sm:w-auto"
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-2">
          <CardTitle className="text-lg">Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid gap-2">
            <Label>Preferred days (posts only on these days)</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_DAYS.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={effectivePreferredDays.includes(d)}
                    onChange={(e) => setPreferredDay(d, e.target.checked)}
                    className="rounded border-input"
                  />
                  {DAY_NAMES[d]}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="max-posts-subreddit">Max posts per subreddit</Label>
              <Input
                id="max-posts-subreddit"
                type="number"
                min={1}
                max={10}
                value={maxPostsPerSubreddit ?? 3}
                onChange={(e) => setMaxPostsPerSubreddit(Number(e.target.value) || 1)}
                className="min-h-[44px] w-full"
              />
            </div>
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="max-uses-query">Max uses per query</Label>
              <Input
                id="max-uses-query"
                type="number"
                min={1}
                max={10}
                value={maxUsesPerQuery ?? 2}
                onChange={(e) => setMaxUsesPerQuery(Number(e.target.value) || 1)}
                className="min-h-[44px] w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 px-0">
        <div className="grid gap-2">
          <Label htmlFor="subreddits">Subreddits</Label>
          <Textarea
            id="subreddits"
            placeholder="One per line or comma-separated (e.g. r/startups, r/SaaS)"
            value={subreddits}
            onChange={(e) => setSubreddits(e.target.value)}
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="queries">ChatGPT queries to target</Label>
          <Textarea
            id="queries"
            placeholder="One per line or comma-separated (e.g. best presentation tools, slide design)"
            value={queries}
            onChange={(e) => setQueries(e.target.value)}
            rows={3}
          />
        </div>
        {queryList.length > 0 && subredditList.length > 0 && (
          <div className="grid gap-2">
            <Label>Query subreddit rules (optional)</Label>
            <p className="text-xs text-muted-foreground">Restrict which subreddits each query can be posted to. Leave empty = all subreddits.</p>
            <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              {queryList.map((q) => (
                <div key={q} className="grid gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{q}</span>
                  <Input
                    type="text"
                    placeholder="r/startups, r/SaaS (or leave empty)"
                    value={getRuleSubreddits(q)}
                    onChange={(e) => setQuerySubredditRule(q, parseList(e.target.value))}
                    className="min-h-[40px] text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-2 max-w-[8rem]">
          <Label htmlFor="posts-per-week">Posts per week</Label>
          <Input
            id="posts-per-week"
            type="number"
            min={1}
            max={50}
            value={postsPerWeek}
            onChange={(e) => setPostsPerWeek(Number(e.target.value) || 1)}
            className="min-h-[44px] text-base"
          />
        </div>
      </div>

      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
          {validation.errors.length > 0 && (
            <ul className="flex flex-col gap-1 text-destructive" role="alert">
              {validation.errors.map((msg, i) => (
                <li key={i} className="flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {msg}
                </li>
              ))}
            </ul>
          )}
          {validation.warnings.length > 0 && (
            <ul className="flex flex-col gap-1 text-muted-foreground">
              {validation.warnings.map((msg, i) => (
                <li key={i} className="flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0 opacity-70" />
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <Button type="submit" disabled={!valid || disabled} size="lg" className="min-h-[48px] w-full sm:w-auto touch-manipulation text-base">
          {isGenerating ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Generating…
            </>
          ) : (
            "Generate calendar"
          )}
        </Button>
        <p className="text-xs text-muted-foreground">Ctrl+Enter to generate</p>
      </div>
    </form>
  );
}
