import { expect, type Page } from "@playwright/test";

export interface Shot {
  /** File name suffix: docs/screenshots/NN-<name>.png */
  name: string;
  /** Router path (hash history adds the #). */
  path: string;
  /** Interactions and assertions to run before the screenshot. */
  steps?: (page: Page) => Promise<void>;
}

// The main states of the prototype, in demo order. The e2e spec walks this list.
export const shots: Shot[] = [
  {
    name: "overview",
    path: "/",
    steps: async (page) => {
      await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
      await expect(page.getByText("252,360").first()).toBeVisible();
      await expect(page.getByRole("list", { name: "Session funnel" })).toBeVisible();
      // Pooled view stays quiet, the per-partner check still flags Sakura Skin.
      const perPartner = page.getByRole("list", { name: "Drift per partner" });
      await expect(perPartner).toContainText(/Sakura Skin\s*Redness \+\d+\.\d pp/);
      await expect(perPartner).toContainText(/Coastline Drug\s*Not enough history/);
    },
  },
  {
    name: "overview-drift",
    path: "/?partner=prt_sakura&range=14",
    steps: async (page) => {
      await expect(page.getByRole("combobox", { name: "Partner" })).toContainText("Sakura Skin");
      await expect(page.getByRole("status").filter({ hasText: "week over week" })).toContainText(
        /Redness \+\d+\.\d pp week over week/,
      );
      await expect(page.getByText("vs previous 14 days").first()).toBeVisible();
      await expect(page.getByText("Concern model 2.3 rollout")).toBeVisible();
    },
  },
  {
    name: "failures",
    path: "/failures?partner=prt_coastline&range=7",
    steps: async (page) => {
      await expect(page.getByRole("heading", { name: "Failures", exact: true })).toBeVisible();
      const table = page.getByRole("table").first();
      const firstRow = table.getByRole("row").nth(1);
      await expect(firstRow).toContainText("Galaxy S24");
      await expect(firstRow).toContainText("Camera permission denied");
      // Sorting by volume puts the busiest segment first; sorting back by rate restores the story.
      await page.getByRole("button", { name: "Sessions" }).click();
      await expect(page.getByRole("columnheader", { name: "Sessions" })).toHaveAttribute(
        "aria-sort",
        "descending",
      );
      await expect(table.getByRole("row").nth(1)).toContainText("iPhone 15");
      await page.getByRole("button", { name: "Failure rate" }).click();
      await expect(page.getByRole("columnheader", { name: "Failure rate" })).toHaveAttribute(
        "aria-sort",
        "descending",
      );
      await expect(table.getByRole("row").nth(1)).toContainText("Galaxy S24");
    },
  },
  {
    name: "latency",
    path: "/latency",
    steps: async (page) => {
      await expect(page.getByRole("heading", { name: "Latency and health" })).toBeVisible();
      await expect(page.getByText("Analysis workers saturated")).toBeVisible();
      await expect(page.locator("[aria-label^='Incident on']")).toHaveCount(3);
      await expect(page.getByText("within the 2.5 s budget")).toBeVisible();
    },
  },
  {
    name: "session-detail",
    path: "/sessions?partner=prt_sakura&range=28",
    steps: async (page) => {
      await expect(page.getByText("Showing 1 to 12 of 70 sessions")).toBeVisible();
      await page.getByRole("combobox", { name: "Outcome" }).click();
      await page.getByRole("option", { name: "Purchased" }).click();
      await expect(page.getByText(/Showing 1 to \d+ of \d+ sessions/)).toBeVisible();
      await expect(page.getByText("Showing 1 to 12 of 70 sessions")).toBeHidden();
      await page
        .getByRole("button", { name: /Open session/ })
        .first()
        .click();
      const sheet = page.getByRole("dialog");
      await expect(sheet).toContainText("Recommendations served");
      await expect(sheet).toContainText("Analysis result");
      await expect(sheet).toContainText("IDR");
      await expect(sheet.getByText("Purchased")).toBeVisible();
    },
  },
];
