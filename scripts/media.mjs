// Turns the newest Playwright video into docs/demo.mp4 and docs/demo.gif. Node only, no deps.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const FFMPEG = "/usr/bin/ffmpeg";
const ROOT = "test-results";
const OUT = "docs";
const GIF_LIMIT = 9 * 1024 * 1024;

function newestWebm(dir) {
  let best = null;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = newestWebm(path);
      if (nested && (!best || nested.mtime > best.mtime)) best = nested;
    } else if (entry.name.endsWith(".webm")) {
      const mtime = statSync(path).mtimeMs;
      if (!best || mtime > best.mtime) best = { path, mtime };
    }
  }
  return best;
}

function ffmpeg(args) {
  execFileSync(FFMPEG, ["-y", "-hide_banner", "-loglevel", "error", ...args], { stdio: "inherit" });
}

const video = newestWebm(ROOT);
if (!video) {
  console.error(`No .webm video found under ${ROOT}/. Run "npm run e2e" first.`);
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const mp4 = join(OUT, "demo.mp4");
ffmpeg([
  "-i",
  video.path,
  "-vf",
  "scale=1280:-2",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "23",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  "-an",
  mp4,
]);
console.log(`wrote ${mp4} (${(statSync(mp4).size / 1024 / 1024).toFixed(1)} MB)`);

const gif = join(OUT, "demo.gif");
let width = 960;
for (;;) {
  const filters = `fps=8,scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5`;
  ffmpeg(["-i", video.path, "-vf", filters, "-loop", "0", gif]);
  const size = statSync(gif).size;
  console.log(`wrote ${gif} at ${width}px (${(size / 1024 / 1024).toFixed(1)} MB)`);
  if (size <= GIF_LIMIT || width <= 320) break;
  width = Math.round(width * 0.8);
}
