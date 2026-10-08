import { defineConfig } from "@playwright/test";
import { ensureFfmpeg } from "./e2e/ffmpeg-shim";

ensureFfmpeg();

const port = 4173;
const baseURL = `http://localhost:${port}/skin-advisor-ops/`;

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    viewport: { width: 1440, height: 900 },
    video: "on",
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH,
    },
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: {
    command: "npm run preview",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
