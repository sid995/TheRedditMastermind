import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfigForm } from "./ConfigForm";
import type { Config } from "@/app/types/calendar";

function defaultConfig(overrides: Partial<Config> = {}): Config {
  return {
    company: { name: "", description: "", goal: "" },
    people: [
      { id: "p1", name: "", description: "" },
      { id: "p2", name: "", description: "" },
    ],
    subreddits: "",
    queries: "",
    postsPerWeek: 5,
    ...overrides,
  };
}

describe("ConfigForm", () => {
  it("renders company name label and Generate calendar button", () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    render(
      <ConfigForm
        config={defaultConfig()}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    );
    expect(screen.getByLabelText(/Company name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Generate calendar/i })).toBeInTheDocument();
  });

  it("submit button is disabled when config is invalid", () => {
    render(
      <ConfigForm
        config={defaultConfig()}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    const btn = screen.getByRole("button", { name: /Generate calendar/i });
    expect(btn).toBeDisabled();
  });

  it("calls onChange when company name is changed", () => {
    const onChange = vi.fn();
    render(
      <ConfigForm
        config={defaultConfig()}
        onChange={onChange}
        onSubmit={vi.fn()}
      />
    );
    const input = screen.getByLabelText(/Company name/i);
    fireEvent.change(input, { target: { value: "Acme" } });
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.company.name).toBe("Acme");
  });

  it("shows Generate calendar when not loading and Generating… when isGenerating", () => {
    const { rerender } = render(
      <ConfigForm
        config={defaultConfig({ company: { name: "X" }, people: [{ id: "p1", name: "A", description: "" }, { id: "p2", name: "B", description: "" }], subreddits: "r/x", queries: "q" })}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /Generate calendar/i })).toBeInTheDocument();
    rerender(
      <ConfigForm
        config={defaultConfig({ company: { name: "X" }, people: [{ id: "p1", name: "A", description: "" }, { id: "p2", name: "B", description: "" }], subreddits: "r/x", queries: "q" })}
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        isGenerating
      />
    );
    expect(screen.getByRole("button", { name: /Generating…/i })).toBeInTheDocument();
  });
});
