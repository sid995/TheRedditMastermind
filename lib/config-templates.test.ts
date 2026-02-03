/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadConfigTemplates,
  saveConfigTemplate,
  deleteConfigTemplate,
} from "./config-templates";
import type { Config } from "@/app/types/calendar";

const STORAGE_KEY = "reddit-mastermind-templates";

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    company: { name: "Co", description: "", goal: "" },
    people: [
      { id: "p1", name: "Alice", description: "" },
      { id: "p2", name: "Bob", description: "" },
    ],
    subreddits: "r/test",
    queries: "q1",
    postsPerWeek: 5,
    ...overrides,
  };
}

describe("config-templates", () => {
  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  describe("loadConfigTemplates", () => {
    it("returns empty array when no templates", () => {
      expect(loadConfigTemplates()).toEqual([]);
    });

    it("returns empty array when storage is invalid", () => {
      localStorage.setItem(STORAGE_KEY, "not json");
      expect(loadConfigTemplates()).toEqual([]);
    });
  });

  describe("saveConfigTemplate", () => {
    it("saves and load returns template with id and name", () => {
      const config = makeConfig();
      const saved = saveConfigTemplate("My Template", config);
      expect(saved.id).toMatch(/^tpl-/);
      expect(saved.name).toBe("My Template");
      expect(saved.config).toEqual(config);

      const list = loadConfigTemplates();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(saved.id);
      expect(list[0].name).toBe("My Template");
      expect(list[0].config.postsPerWeek).toBe(5);
    });

    it("trims empty name to Untitled", () => {
      const saved = saveConfigTemplate("   ", makeConfig());
      expect(saved.name).toBe("Untitled");
    });

    it("prepends so newest is first", () => {
      saveConfigTemplate("First", makeConfig({ postsPerWeek: 1 }));
      saveConfigTemplate("Second", makeConfig({ postsPerWeek: 2 }));
      const list = loadConfigTemplates();
      expect(list[0].name).toBe("Second");
      expect(list[1].name).toBe("First");
    });
  });

  describe("deleteConfigTemplate", () => {
    it("removes template by id", () => {
      const t = saveConfigTemplate("T", makeConfig());
      expect(loadConfigTemplates()).toHaveLength(1);
      deleteConfigTemplate(t.id);
      expect(loadConfigTemplates()).toHaveLength(0);
    });

    it("leaves other templates", () => {
      vi.useFakeTimers();
      saveConfigTemplate("A", makeConfig());
      vi.advanceTimersByTime(1);
      const b = saveConfigTemplate("B", makeConfig());
      vi.useRealTimers();
      deleteConfigTemplate(b.id);
      const list = loadConfigTemplates();
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe("A");
      expect(list[0].id).not.toBe(b.id);
    });
  });
});
