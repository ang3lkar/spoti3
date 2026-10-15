import https from "node:https";
import sharp from "sharp";

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

export function detectImageProtocol() {
  const termProgram = process.env.TERM_PROGRAM || "";
  const term = process.env.TERM || "";

  if (termProgram === "iTerm.app" || termProgram === "WezTerm") return "iterm";
  if (
    termProgram === "ghostty" ||
    term === "xterm-ghostty" ||
    term === "xterm-kitty"
  ) {
    return "kitty";
  }
  return null;
}

export function supportsInlineImages() {
  return detectImageProtocol() !== null;
}

const KITTY_CHUNK_SIZE = 4096;

export function buildKittyChunks(base64Data, size = 20) {
  const chunks = [];
  for (let i = 0; i < base64Data.length; i += KITTY_CHUNK_SIZE) {
    const more = i + KITTY_CHUNK_SIZE < base64Data.length ? 1 : 0;
    const payload = base64Data.slice(i, i + KITTY_CHUNK_SIZE);
    const control = i === 0 ? `a=T,f=100,c=${size},m=${more}` : `m=${more}`;
    chunks.push(`\x1b_G${control};${payload}\x1b\\`);
  }
  return chunks;
}

/**
 * Displays an image in the terminal using the iTerm2 (OSC 1337) or Kitty
 * graphics protocol, depending on the detected terminal.
 *
 * @param {Buffer|Uint8Array} imageData - The image data as a buffer
 * @param {Object} options - Display options
 * @param {number} options.size - Size in cell columns for display (default: 20)
 * @returns {Promise<boolean>} True if image was displayed, false otherwise
 */
export async function displayImageInTerminal(imageData, options = {}) {
  const protocol = detectImageProtocol();
  if (!protocol) return false;

  const { size = 20 } = options;

  try {
    if (protocol === "kitty") {
      const png = await sharp(Buffer.from(imageData)).png().toBuffer();
      process.stdout.write(buildKittyChunks(png.toString("base64"), size).join(""));
    } else {
      const base64Data = Buffer.from(imageData).toString("base64");
      process.stdout.write(`\x1b]1337;File=inline=1;width=${size}:${base64Data}\x07`);
    }
    process.stdout.write("\n");
    return true;
  } catch {
    return false;
  }
}
