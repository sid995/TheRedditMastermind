"use client";

import type { Config, CompanyInfo, Person } from "@/app/types/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserPlus } from "lucide-react";

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

export function ConfigForm({ config, onChange, onSubmit, disabled, isGenerating }: ConfigFormProps) {
  const { company, people, subreddits, queries, postsPerWeek } = config;

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

  const valid =
    company.name.trim() &&
    people.length >= 2 &&
    people.every((p) => p.name.trim()) &&
    parseList(subreddits).length >= 1 &&
    parseList(queries).length >= 1 &&
    postsPerWeek >= 1;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>People (min 2)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addPerson}>
            <UserPlus className="size-4" />
            Add person
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {people.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-4 flex flex-wrap items-center gap-3">
                <div className="grid gap-2 flex-1 min-w-[140px]">
                  <Label htmlFor={`person-name-${p.id}`}>Name</Label>
                  <Input
                    id={`person-name-${p.id}`}
                    type="text"
                    placeholder="Person name"
                    value={p.name}
                    onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2 flex-1 min-w-[140px]">
                  <Label htmlFor={`person-desc-${p.id}`}>Description (optional)</Label>
                  <Input
                    id={`person-desc-${p.id}`}
                    type="text"
                    placeholder="Role or bio"
                    value={p.description ?? ""}
                    onChange={(e) => updatePerson(p.id, { description: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removePerson(p.id)}
                  disabled={people.length <= 2}
                  className="self-end"
                >
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
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
        <div className="grid gap-2 max-w-[8rem]">
          <Label htmlFor="posts-per-week">Posts per week</Label>
          <Input
            id="posts-per-week"
            type="number"
            min={1}
            max={50}
            value={postsPerWeek}
            onChange={(e) => setPostsPerWeek(Number(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Button type="submit" disabled={!valid || disabled} size="lg">
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
