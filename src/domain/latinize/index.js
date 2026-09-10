import fs from "fs";
import path from "path";
import { logger } from "../../utils/logger.js";
import { greekToLatin } from "../../utils/basic.js";
import { latinizeTags } from "../tag/index.js";

const GREEK_PATTERN = /[Ͱ-Ͽἀ-῿]/;
const GREEK_RUN_PATTERN = /[Ͱ-Ͽἀ-῿]+/gu;

/**
 * Transliterates Greek characters to Latin, leaving any string with no Greek
 * characters byte-identical. greekToLatin() strips combining marks from the
 * whole string it's given, so calling it on a mixed string (e.g.
 * "Café — Νίκος") would also de-accent the Latin portion. To avoid that,
 * only the contiguous Greek runs within the string are passed to it, so
 * unrelated Latin text (e.g. "Björk", "Café") never touches it.
 */
export function latinize(text) {
  if (typeof text !== "string" || !GREEK_PATTERN.test(text)) return text;
  return text.replace(GREEK_RUN_PATTERN, (greekRun) => greekToLatin(greekRun));
}

function isMp3(name) {
  return /\.mp3$/i.test(name);
}

function collectEntriesBottomUp(dir, results = []) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      collectEntriesBottomUp(fullPath, results);
      results.push({ path: fullPath, name: dirent.name, isDirectory: true });
    } else if (dirent.isFile()) {
      results.push({ path: fullPath, name: dirent.name, isDirectory: false });
    }
  }

  return results;
}

function retagFiles(entries, { dryRun }) {
  const mp3Files = entries.filter(
    (entry) => !entry.isDirectory && isMp3(entry.name)
  );

  let filesRetagged = 0;
  let errors = 0;

  for (const file of mp3Files) {
    try {
      const result = latinizeTags(file.path, latinize, { dryRun });

      if (result.changed) {
        filesRetagged += 1;
        logger.info(
          `${dryRun ? "[dry-run] " : ""}Retag ${file.path} (${result.changedFrames.join(", ")})`
        );
      }
    } catch (err) {
      errors += 1;
      logger.error(`Failed to retag ${file.path}: ${err.message}`);
    }
  }

  return { filesRetagged, errors };
}

function renameEntries(entries, { dryRun }) {
  let filesRenamed = 0;
  let foldersRenamed = 0;
  let conflicts = 0;
  let errors = 0;

  for (const entry of entries) {
    const newName = latinize(entry.name);
    if (newName === entry.name) continue;

    const newPath = path.join(path.dirname(entry.path), newName);

    if (fs.existsSync(newPath)) {
      conflicts += 1;
      logger.warn(
        `Conflict: ${newPath} already exists, skipping rename of ${entry.path}`
      );
      continue;
    }

    if (dryRun) {
      logger.info(`[dry-run] Rename ${entry.path} -> ${newPath}`);
    } else {
      try {
        fs.renameSync(entry.path, newPath);
        logger.info(`Renamed ${entry.path} -> ${newPath}`);
      } catch (err) {
        errors += 1;
        logger.error(`Failed to rename ${entry.path}: ${err.message}`);
        continue;
      }
    }

    if (entry.isDirectory) foldersRenamed += 1;
    else filesRenamed += 1;
  }

  return { filesRenamed, foldersRenamed, conflicts, errors };
}

/**
 * Recursively replaces Greek characters with Latin counterparts in file and
 * folder names, and in MP3 ID3 tags, under `dir`.
 *
 * @param {{ dir: string, options?: { dryRun?: boolean } }} args
 * @returns {{ filesRenamed: number, foldersRenamed: number, filesRetagged: number, conflicts: number, errors: number }}
 */
export function latinizeDirectory({ dir, options = {} }) {
  const dryRun = Boolean(options.dryRun);

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error(`"${dir}" is not a valid directory`);
  }

  logger.start(`${dryRun ? "Planning" : "Running"} latinize on ${dir}...`);

  const entries = collectEntriesBottomUp(dir);

  const tagResult = retagFiles(entries, { dryRun });
  const renameResult = renameEntries(entries, { dryRun });

  const summary = {
    filesRenamed: renameResult.filesRenamed,
    foldersRenamed: renameResult.foldersRenamed,
    filesRetagged: tagResult.filesRetagged,
    conflicts: renameResult.conflicts,
    errors: tagResult.errors + renameResult.errors,
  };

  logger.newLine();
  logger.info(`${dryRun ? "Plan" : "Summary"}:`);
  logger.info(`  Files renamed: ${summary.filesRenamed}`);
  logger.info(`  Folders renamed: ${summary.foldersRenamed}`);
  logger.info(`  Files retagged: ${summary.filesRetagged}`);
  logger.info(`  Conflicts skipped: ${summary.conflicts}`);
  logger.info(`  Errors: ${summary.errors}`);

  return summary;
}
