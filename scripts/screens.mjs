// Regenerates the README and landing-page screenshots in public/screens.
// Needs a production build (`npm run build`) and DEMO_PASSWORD in .env.
// Two passes: the app screens first, then a rebuild so the landing page
// bundles the new images, then the landing screenshots.
//
//   npm run screens
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const scratch = mkdtempSync(path.join(tmpdir(), "supportai-screens-"));
const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run("npx", ["playwright", "test", "--project=screens", "-g", "marketing"], { SCREENS_DIR: scratch, SCREENS: "marketing" });
run("npm", ["run", "build"]);
run("npx", ["playwright", "test", "--project=screens", "-g", '"marketing landing"'], {
  SCREENS_DIR: scratch,
  SCREENS: "marketing-landing",
});
console.log("Screenshots written to public/screens");
