import https from "node:https";

function removeEmojis(text) {
  return text.replace(/[\u{1F600}-\u{1F6FF}]/gu, "");
}

function removeSpecialCharacters(text) {
  return text.replace(/[^\w\s]/gi, "");
}

const GREEK_SINGLE_MAP = {
  α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", ι: "i", κ: "k",
  λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r", σ: "s", ς: "s",
  τ: "t", υ: "y", φ: "f", ω: "o",
  Α: "A", Β: "V", Γ: "G", Δ: "D", Ε: "E", Ζ: "Z", Η: "I", Ι: "I", Κ: "K",
  Λ: "L", Μ: "M", Ν: "N", Ξ: "X", Ο: "O", Π: "P", Ρ: "R", Σ: "S", Τ: "T",
  Υ: "Y", Φ: "F", Ω: "O",
};

const GREEK_MULTI_MAP = { θ: "th", χ: "ch", ψ: "ps" };
const GREEK_MULTI_MAP_UPPER = { Θ: "th", Χ: "ch", Ψ: "ps" };

function isUpperCase(char) {
  return Boolean(
    char && char === char.toUpperCase() && char !== char.toLowerCase()
  );
}

function transliterateChar(char, nextChar) {
  if (GREEK_SINGLE_MAP[char]) return GREEK_SINGLE_MAP[char];
  if (GREEK_MULTI_MAP[char]) return GREEK_MULTI_MAP[char];
  if (GREEK_MULTI_MAP_UPPER[char]) {
    const base = GREEK_MULTI_MAP_UPPER[char];
    return isUpperCase(nextChar)
      ? base.toUpperCase()
      : base[0].toUpperCase() + base.slice(1);
  }
  return char;
}

/**
 * Transliterates Greek text to Latin characters using an ELOT-743-style
 * mapping, so filenames and tags stay in a single, filesystem-friendly script.
 *
 * The context-dependent αυ/ευ/μπ/ντ/γκ ELOT rules are deliberately omitted -
 * they matter for official transliteration but are unnecessary for filenames.
 *
 * @param {string} text The text to transliterate
 * @returns {string} The transliterated text, or the input unchanged if it isn't a non-empty string
 */
export function greekToLatin(text) {
  if (typeof text !== "string" || text.length === 0) return text;

  const stripped = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .normalize("NFC");

  const withDigraphs = stripped
    .replace(/ΟΥ/g, "OU")
    .replace(/Ου/g, "Ou")
    .replace(/ου/g, "ou");

  const chars = Array.from(withDigraphs);
  return chars.map((char, i) => transliterateChar(char, chars[i + 1])).join("");
}

/**
 * Converts a title to a friendly filename, no spaces and irregular chars and adding the playlist id
 *
 * @param {*} playlist The Spotify playlist object
 * @returns A string representing the friendly filename
 */
export function titleToFriendlyName(playlist) {
  const { id, name } = playlist;

  let result = greekToLatin(name);

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
