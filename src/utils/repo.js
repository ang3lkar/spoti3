import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the repository root directory
 * @returns {string} The absolute path to the repository root
 */
export function getRepoRoot() {
  let currentDir = __dirname;

  // Start from the current file's directory and walk up
  while (currentDir !== "/") {
    const packageJsonPath = resolve(currentDir, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = resolve(currentDir, "..");
  }

  // Fallback to process.cwd() if package.json not found
  return process.cwd();
}
