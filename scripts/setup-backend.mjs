import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const backend = join(root, "backend");
const repository = "https://github.com/AbuSnineh-dev/NovaMart-backend.git";
const revision = "8f5ca4d84496df49570f886844b57d1a0e953fd7";
function git(args) {
  const result = spawnSync("git", args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`git command failed (${result.status})`);
}
if (existsSync(backend)) {
  console.log(
    "backend/ already exists. Existing files and Git history were preserved.",
  );
} else {
  git(["clone", "--no-checkout", repository, backend]);
  git(["-C", backend, "checkout", "--detach", revision]);
  const patches = ["backend-integration.patch", "backend-new-tests.patch"].map(
    (name) => join(root, "docs", name),
  );
  for (const patch of patches) git(["-C", backend, "apply", "--check", patch]);
  for (const patch of patches) git(["-C", backend, "apply", patch]);
  console.log(
    "Prepared the tested backend revision with local integration fixes.",
  );
}
console.log("Next: npm --prefix backend ci");
console.log("Then: npm --prefix backend run build");
console.log("Then: npm run demo");
