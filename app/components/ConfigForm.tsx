"use client";

import type { Config, CompanyInfo, Persona } from "@/app/types/calendar";

function defaultPersona(id: string): Persona {
  return { id, name: "", description: "" };
}

function parseList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatList(arr: string[]): string {
  return arr.join(", ");
}

interface ConfigFormProps {
  config: Config;
  onChange: (config: Config) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function ConfigForm({ config, onChange, onSubmit, disabled }: ConfigFormProps) {
  const { company, personas, subreddits, queries, postsPerWeek } = config;

  const setCompany = (c: Partial<CompanyInfo>) => {
    onChange({ ...config, company: { ...company, ...c } });
  };

  const setPersonas = (p: Persona[]) => {
    onChange({ ...config, personas: p });
  };

  const addPersona = () => {
    const id = `persona-${Date.now()}`;
    setPersonas([...personas, defaultPersona(id)]);
  };

  const removePersona = (id: string) => {
    if (personas.length <= 2) return;
    setPersonas(personas.filter((p) => p.id !== id));
  };

  const updatePersona = (id: string, updates: Partial<Persona>) => {
    setPersonas(
      personas.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const setSubreddits = (text: string) => {
    onChange({ ...config, subreddits: parseList(text) });
  };

  const setQueries = (text: string) => {
    onChange({ ...config, queries: parseList(text) });
  };

  const setPostsPerWeek = (n: number) => {
    onChange({ ...config, postsPerWeek: Math.max(1, Math.min(50, n)) });
  };

  const valid =
    company.name.trim() &&
    personas.length >= 2 &&
    personas.every((p) => p.name.trim()) &&
    subreddits.length >= 1 &&
    queries.length >= 1 &&
    postsPerWeek >= 1;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit();
      }}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Company
        </h2>
        <input
          type="text"
          placeholder="Company name"
          value={company.name}
          onChange={(e) => setCompany({ name: e.target.value })}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          type="text"
          placeholder="Website (optional)"
          value={company.website ?? ""}
          onChange={(e) => setCompany({ website: e.target.value })}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={company.description ?? ""}
          onChange={(e) => setCompany({ description: e.target.value })}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <input
          type="text"
          placeholder="Goal (optional)"
          value={company.goal ?? ""}
          onChange={(e) => setCompany({ goal: e.target.value })}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Personas (min 2)
          </h2>
          <button
            type="button"
            onClick={addPersona}
            className="rounded bg-zinc-200 px-3 py-1 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-500"
          >
            Add persona
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {personas.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-2 rounded border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-600 dark:bg-zinc-800/50"
            >
              <input
                type="text"
                placeholder="Persona name"
                value={p.name}
                onChange={(e) => updatePersona(p.id, { name: e.target.value })}
                className="flex-1 min-w-[120px] rounded border border-zinc-300 bg-white px-3 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={p.description ?? ""}
                onChange={(e) => updatePersona(p.id, { description: e.target.value })}
                className="flex-1 min-w-[120px] rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => removePersona(p.id)}
                disabled={personas.length <= 2}
                className="rounded px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Subreddits
        </h2>
        <textarea
          placeholder="One per line or comma-separated (e.g. r/startups, r/SaaS)"
          value={formatList(subreddits)}
          onChange={(e) => setSubreddits(e.target.value)}
          rows={3}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          ChatGPT queries to target
        </h2>
        <textarea
          placeholder="One per line or comma-separated (e.g. best presentation tools, slide design)"
          value={formatList(queries)}
          onChange={(e) => setQueries(e.target.value)}
          rows={3}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Posts per week
        </h2>
        <input
          type="number"
          min={1}
          max={50}
          value={postsPerWeek}
          onChange={(e) => setPostsPerWeek(Number(e.target.value) || 1)}
          className="w-24 rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={!valid || disabled}
        className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Generate calendar
      </button>
    </form>
  );
}
