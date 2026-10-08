import { existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

// Playwright records video with its own ffmpeg build, downloaded by `playwright install`.
// Offline sandboxes often have an older cached revision or none at all. When the expected
// revision is missing, build a browsers directory under node_modules/.cache that reuses the
// cached browsers plus a working ffmpeg (system ffmpeg first), and point
// PLAYWRIGHT_BROWSERS_PATH at it.
// No-op when Playwright's own ffmpeg exists.
export function ensureFfmpeg(): void {
  if (process.platform === "win32") return;

  const exe = process.platform === "darwin" ? "ffmpeg-mac" : "ffmpeg-linux";
  const registry =
    process.env.PLAYWRIGHT_BROWSERS_PATH ??
    (process.platform === "darwin"
      ? join(homedir(), "Library", "Caches", "ms-playwright")
      : join(process.env.XDG_CACHE_HOME ?? join(homedir(), ".cache"), "ms-playwright"));

  const browsersJson = resolve("node_modules/playwright-core/browsers.json");
  if (!existsSync(browsersJson)) return;
  const { browsers } = JSON.parse(readFileSync(browsersJson, "utf8")) as {
    browsers: { name: string; revision: string }[];
  };
  const revision = browsers.find((b) => b.name === "ffmpeg")?.revision;
  if (!revision) return;
  if (existsSync(join(registry, `ffmpeg-${revision}`, exe))) return;

  // Prefer the system ffmpeg: older Playwright builds lack the VP9 flags newer versions pass.
  const candidates = [process.env.FFMPEG_PATH ?? "/usr/bin/ffmpeg"];
  if (existsSync(registry)) {
    for (const dir of readdirSync(registry)
      .filter((d) => d.startsWith("ffmpeg-"))
      .sort()
      .reverse()) {
      candidates.push(join(registry, dir, exe));
    }
  }
  const fallback = candidates.find((c) => existsSync(c));
  if (!fallback) return;

  const shim = resolve("node_modules/.cache/pw-browsers");
  mkdirSync(join(shim, `ffmpeg-${revision}`), { recursive: true });
  link(fallback, join(shim, `ffmpeg-${revision}`, exe));
  if (existsSync(registry)) {
    for (const entry of readdirSync(registry)) {
      if (!entry.startsWith("ffmpeg-")) link(join(registry, entry), join(shim, entry));
    }
  }
  process.env.PLAYWRIGHT_BROWSERS_PATH = shim;
}

function link(target: string, path: string) {
  if (!existsSync(path)) symlinkSync(target, path);
}
