import type { Config } from "@/app/types/calendar";

const STORAGE_KEY = "reddit-mastermind-templates";

export interface ConfigTemplate {
  id: string;
  name: string;
  config: Config;
  createdAt: string; // ISO
}

export function loadConfigTemplates(): ConfigTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConfigTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConfigTemplate(name: string, config: Config): ConfigTemplate {
  const templates = loadConfigTemplates();
  const template: ConfigTemplate = {
    id: `tpl-${Date.now()}`,
    name: name.trim() || "Untitled",
    config: JSON.parse(JSON.stringify(config)),
    createdAt: new Date().toISOString(),
  };
  templates.unshift(template);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
  return template;
}

export function deleteConfigTemplate(id: string): void {
  const templates = loadConfigTemplates().filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore
  }
}
