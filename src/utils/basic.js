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

/**
 * Checks if the current terminal supports inline images (iTerm2, Kitty, WezTerm)
 *
 * @returns {boolean} True if terminal supports inline images
 */
export function supportsInlineImages() {
  const termProgram = process.env.TERM_PROGRAM || "";
  const term = process.env.TERM || "";

  // iTerm2 sets TERM_PROGRAM to "iTerm.app"
  if (termProgram === "iTerm.app") return true;

  // WezTerm sets TERM_PROGRAM to "WezTerm"
  if (termProgram === "WezTerm") return true;

  // Kitty sets TERM to "xterm-kitty"
  if (term === "xterm-kitty") return true;

  return false;
}

/**
 * Displays an image in the terminal using iTerm2 inline images protocol
 * Works in iTerm2, Kitty, WezTerm, and other compatible terminals
 * Returns false if terminal doesn't support inline images
 *
 * @param {Buffer|Uint8Array} imageData - The image data as a buffer
 * @param {Object} options - Display options
 * @param {number} options.size - Size in characters for display (default: 20)
 * @returns {boolean} True if image was displayed, false otherwise
 */
export function displayImageInTerminal(imageData, options = {}) {
  if (!supportsInlineImages()) {
    return false;
  }

  const { size = 20 } = options;

  const base64Data = Buffer.from(imageData).toString("base64");

  // Build iTerm2 inline image escape sequence
  const params = `inline=1;width=${size}`;

  // OSC 1337 ; File=[params]:[base64 data] BEL
  const escapeSequence = `\x1b]1337;File=${params}:${base64Data}\x07`;

  process.stdout.write(escapeSequence);
  process.stdout.write("\n");

  return true;
}
