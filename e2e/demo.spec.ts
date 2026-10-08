import { expect, test } from "@playwright/test";
import { shots } from "./shots";

// Video is recorded for this spec (see playwright.config.ts) and turned into docs/demo.* by `npm run media`.
test.use({ video: "on" });

const footer = "Independent concept by Valentin Szczupak.";

test("walks the main states and captures screenshots", async ({ page }) => {
  for (const [index, shot] of shots.entries()) {
    // Hash-only navigation keeps the document; reload so every shot starts from a fresh app state.
    await page.goto(`#${shot.path}`);
    await page.reload();
    await expect(page.getByText(footer)).toBeVisible();
    await expect(page.locator("[aria-busy='true']")).toHaveCount(0);
    await shot.steps?.(page);
    const file = `${String(index + 1).padStart(2, "0")}-${shot.name}.png`;
    await page.screenshot({
      path: `docs/screenshots/${file}`,
      fullPage: false,
      animations: "disabled",
    });
  }
});
