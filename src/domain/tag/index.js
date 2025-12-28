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
export function setTags(file, tags = {}, options = {}) {
  const { logger: log = logger } = options;
  try {
    const { title, artist, ordinal, album, artBytes } = tags;

    log.newLine();
    log.debug(
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

    log.info(`Set tags successfully`);

    // Handle error if there's any
    if (mp3tag.error !== "") throw new Error(mp3tag.error);

    fs.writeFileSync(file, mp3tag.buffer);
  } catch (err) {
    log.error(err);
    throw new Error(`Failed to set tags for ${file}: ${err.message}`);
  }
}
