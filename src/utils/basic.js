import https from "node:https";

function removeEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F6FF}]/gu, "");
}

function removeSpecialCharacters(text) {
  return text.replace(/[^\w\s]/gi, "");
}

/**
 * Converts a title to a friendly filename, no spaces and irregular chars and adding the playlist id
 *
 * @param {*} playlist The Spotify playlist object
 * @returns A string representing the friendly filename
 */
export function titleToFriendlyName(playlist) {
  const { id, name } = playlist;

  let result = name;

  result = removeEmojis(result);
  result = removeSpecialCharacters(result);
  result = result.replace(/\s/g, "-");

  result = `${result}-${id}`;

  // if more than one dash, replace with a single dash
  result = result.replace(/-+/g, "-");

  return result;
}

/**
 * A function to delay the execution of a promise
 *
 * @param {*} ms The number of milliseconds to wait
 * @returns
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Downloads an image from a URL directly to memory
 *
 * @param {string} url The URL of the image to download
 * @returns {Promise<Buffer>} A buffer containing the image data
 */
export async function downloadImageToMemory(url) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    https
      .get(url, (response) => {
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

export function getOrdinalString(ordinal, totalLength) {
  const totalDigits = totalLength.toString().length;
  const ordinalString = ordinal.toString().padStart(totalDigits, "0");
  return ordinalString;
}
