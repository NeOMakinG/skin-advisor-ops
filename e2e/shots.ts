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
      await expect(page.getByText("Showing 8 of 8 accounts")).toBeVisible();
    },
  },
  {
    name: "overview-filtered",
    path: "/",
    steps: async (page) => {
      await page.getByLabel("Filter accounts").fill("credit");
      await expect(page.getByText("Showing 2 of 8 accounts")).toBeVisible();
      await page.getByRole("button", { name: "Balance" }).click();
      await expect(page.getByRole("columnheader", { name: "Balance" })).toHaveAttribute(
        "aria-sort",
        "descending",
      );
    },
  },
  {
    name: "account-credit",
    path: "/accounts/acc_003",
    steps: async (page) => {
      await expect(page.getByRole("heading", { name: "Fleet Fuel Card" })).toBeVisible();
      await expect(page.getByText("Utilization")).toBeVisible();
      await expect(page.getByRole("progressbar", { name: "Credit utilization" })).toBeVisible();
    },
  },
  {
    name: "edit-dialog",
    path: "/accounts/acc_003",
    steps: async (page) => {
      await page.getByRole("button", { name: "Edit" }).click();
      await expect(page.getByRole("dialog", { name: "Edit account" })).toBeVisible();
      await page.getByLabel("Credit limit (USD)").fill("1000");
      await page.getByRole("button", { name: "Save changes" }).click();
      await expect(page.getByRole("alert")).toContainText("cannot be below the amount owed");
    },
  },
  {
    name: "edit-saved",
    path: "/accounts/acc_003",
    steps: async (page) => {
      await page.getByRole("button", { name: "Edit" }).click();
      await page.getByLabel("Name").fill("Fleet Fuel Cards");
      await page.getByRole("button", { name: "Save changes" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.getByRole("heading", { name: "Fleet Fuel Cards" })).toBeVisible();
    },
  },
  {
    name: "edit-locked",
    path: "/accounts/acc_001",
    steps: async (page) => {
      await page.getByRole("combobox", { name: "Signed in as" }).click();
      await page.getByRole("option", { name: /Mei Lindqvist/ }).click();
      await expect(page.getByRole("heading", { name: "Northwind Payroll" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Edit" })).toBeDisabled();
      await page.getByRole("button", { name: "Edit" }).hover();
      await expect(page.getByRole("tooltip")).toContainText("Only admins or the account owner");
    },
  },
  {
    name: "not-found",
    path: "/accounts/acc_404",
    steps: async (page) => {
      await expect(page.getByRole("heading", { name: "Account not found" })).toBeVisible();
    },
  },
];
