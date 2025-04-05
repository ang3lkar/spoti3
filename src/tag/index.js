import fs from "fs";
import MP3Tag from "mp3tag.js";
import { logger } from "../utils/logger.js";
import { getFileName } from "../utils/file.js";
/**
 * A function to set the tags of an mp3 file.
 *
 * @param {*} file
 * @param {*} tags
 */
export function setTags(file, tags = {}) {
  try {
    logger.debug(`Setting tags for ${getFileName(file)}...`);

    const buffer = fs.readFileSync(file);

    const mp3tag = new MP3Tag(buffer, true);

    mp3tag.read();

    const { title, artist, ordinal, album, artBytes } = tags;

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

    logger.debug(`Set tags for ${getFileName(file)}`);

    // Handle error if there's any
    if (mp3tag.error !== "") throw new Error(mp3tag.error);

    fs.writeFileSync(file, mp3tag.buffer);
  } catch (err) {
    logger.error(err);
    throw new Error(`Failed to set tags for ${file}: ${err.message}`);
  }
}
