import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("reddit-mastermind-onboarding-done", "true");
  });
});

test.describe("Home page", () => {
  test("loads and shows configuration form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Configuration").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/company name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /generate calendar/i })).toBeVisible();
  });

  test("full flow: fill config, generate calendar, see week view", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel(/company name/i).fill("Test Co");
    await page.getByPlaceholder("Person name").first().fill("Alice");
    await page.getByPlaceholder("Person name").nth(1).fill("Bob");
    await page.getByPlaceholder(/one per line or comma/i).first().fill("r/startups, r/SaaS");
    await page.getByPlaceholder(/one per line or comma/i).nth(1).fill("best tools");
    await page.getByRole("button", { name: /generate calendar/i }).click();
    await expect(page.getByText(/content calendar/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/sun|mon|tue|wed|thu|fri|sat/i).first()).toBeVisible();
  });
});
