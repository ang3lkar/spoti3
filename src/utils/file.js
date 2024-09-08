import fs from "fs";

/**
 * A function to get an array of strings from a file
 *
 * @param {*} filePath The path to the file to read
 * @returns An array of strings representing the lines in the file
 */
export function getArrayFromFile(filePath) {
  return fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
}

export class File {
  constructor(fileName) {
    this.fileName = fileName;
  }

  // Clear the file before writing
  clear() {
    fs.writeFileSync(this.fileName, "");
  }

  append(line) {
    fs.writeFileSync(this.fileName, `${line}\n`, { flag: "a" });
  }
}

