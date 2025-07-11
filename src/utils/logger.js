import readline from "readline";
import chalk from "chalk";
import { createConsola } from "consola";
import { app } from "../config/index.js";

const { LEVELS, LEVEL } = app.LOGGING;

const baseLogger = createConsola({
  level: LEVELS[LEVEL] || LEVELS["info"],
  fancy: true,
  formatOptins: {
    columns: 80,
    colors: false,
    compact: false,
    date: false,
  },
});

class Logger {
  start(message) {
    readline.cursorTo(process.stdout, 0);
    baseLogger.start(message);
  }

  box(message) {
    process.stdout.clearLine(0);
    process.stdout.write("\n");
    baseLogger.box(message);
  }

  prompt(message, options) {
    readline.cursorTo(process.stdout, 0);
    return baseLogger.prompt(message, options);
  }

  debug(message) {
    readline.cursorTo(process.stdout, 0);
    baseLogger.debug(chalk.gray.italic(message));
  }

  warn(message) {
    readline.cursorTo(process.stdout, 0);
    baseLogger.warn(chalk.yellow(message));
  }

  info(message) {
    readline.cursorTo(process.stdout, 0);
    baseLogger.info(message);
  }

  error(message) {
    readline.cursorTo(process.stdout, 0);
    baseLogger.error(chalk.red(message));
  }

  progress(message) {
    this.info(message);

    process.stdout.clearLine(0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(message);
  }
}

const logger = new Logger();

/**
 * Call a function silently
 *
 * @param {*} fn
 * @param  {...any} args
 * @returns
 */
function callSilently(fn, ...args) {
  const originalLog = console.log;
  console.log = () => {}; // Mute logs
  try {
    return fn(...args);
  } finally {
    console.log = originalLog; // Restore logs
  }
}

export { logger, callSilently };
