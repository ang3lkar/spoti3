import fs from "fs";
import MP3Tag from "mp3tag.js";

/**
 * A function to set the tags of an mp3 file.
 *
 * @param {*} file
 * @param {*} tags
 */
export function setTags(file, tags = {}) {
  try {
    const buffer = fs.readFileSync(file);

    const mp3tag = new MP3Tag(buffer, true);

    mp3tag.read();

    const { title, artist, ordinal, album } = tags;

    if (title) {
      mp3tag.tags.title = title;
			mp3tag.tags.v2.TRCK = title
    }

    if (artist) {
      mp3tag.tags.artist = artist;
			mp3tag.tags.v2.TPE1 = artist;
    }

    if (ordinal) {
      mp3tag.tags.track = ordinal;
			mp3tag.tags.v2.TSOA = ordinal;
    }

    if (album) {
      mp3tag.tags.album = album;
    }

    mp3tag.save();

    // Handle error if there's any
    if (mp3tag.error !== "") throw new Error(mp3tag.error);

    // Write the new buffer to file
    fs.writeFileSync(file, mp3tag.buffer);
  } catch (err) {
    console.error(err);
  }
}
