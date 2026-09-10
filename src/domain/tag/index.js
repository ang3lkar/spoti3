import fs from "fs";
import MP3Tag from "mp3tag.js";
import { logger } from "../../utils/logger.js";
/**
 * A function to set the tags of an mp3 file.
 *
 * @param {*} file
 * @param {*} tags
 * @param {*} options
 */
export function setTags(file, tags = {}) {
  try {
    const { title, artist, ordinal, album, artBytes } = tags;

    logger.newLine();
    logger.debug(
      `Setting tags: (title=${title}, artist=${artist}, ordinal=${ordinal}, album=${album})`
    );

    const buffer = fs.readFileSync(file);

    const mp3tag = new MP3Tag(buffer, true);

    mp3tag.read();

    if (title) {
      mp3tag.tags.title = title;
      mp3tag.tags.v2.TIT2 = title;
    }

    if (artist) {
      mp3tag.tags.artist = artist;
      mp3tag.tags.v2.TPE1 = artist;
    }

    if (ordinal) {
      mp3tag.tags.track = ordinal;
      mp3tag.tags.v2.TRCK = ordinal.toString();
    }

    if (album) {
      mp3tag.tags.album = album;
      mp3tag.tags.v2.TALB = album;
    }

    if (artBytes) {
      mp3tag.tags.v2.APIC = [
        {
          format: "image/jpeg",
          type: 3,
          description: "Album image",
          data: artBytes,
        },
      ];
    }

    mp3tag.save();

    logger.info(`Set tags successfully`);

    // Handle error if there's any
    if (mp3tag.error !== "") throw new Error(mp3tag.error);

    fs.writeFileSync(file, mp3tag.buffer);
  } catch (err) {
    logger.error(err);
    throw new Error(`Failed to set tags for ${file}: ${err.message}`);
  }
}

const TITLE_FRAMES = { TIT2: "title", TPE1: "artist", TALB: "album" };

/**
 * Applies a text transform to every string frame in an mp3 file's ID3v2 tags.
 *
 * @param {string} file Path to the mp3 file
 * @param {(value: string) => string} transform Transform applied to each string frame value
 * @param {{ dryRun?: boolean }} [options]
 * @returns {{ changed: boolean, changedFrames: string[] }}
 */
export function latinizeTags(file, transform, { dryRun = false } = {}) {
  const buffer = fs.readFileSync(file);

  const mp3tag = new MP3Tag(buffer, true);

  mp3tag.read();

  const v2 = mp3tag.tags.v2;
  const changedFrames = [];

  for (const [frame, value] of Object.entries(v2)) {
    if (typeof value !== "string") continue;

    const transformed = transform(value);
    if (transformed === value) continue;

    v2[frame] = transformed;
    changedFrames.push(frame);
  }

  if (changedFrames.length === 0 || dryRun) {
    return { changed: changedFrames.length > 0, changedFrames };
  }

  for (const [frame, accessor] of Object.entries(TITLE_FRAMES)) {
    if (changedFrames.includes(frame)) {
      mp3tag.tags[accessor] = v2[frame];
    }
  }

  mp3tag.save();

  if (mp3tag.error !== "") throw new Error(mp3tag.error);

  fs.writeFileSync(file, mp3tag.buffer);

  return { changed: true, changedFrames };
}
