import chalk from "chalk";
import { createConsola } from "consola";
import { app } from "../config/index.js";

const { LEVELS } = app.LOGGING;

const LEVEL = process.env.LOG_LEVEL || "debug";

const baseLogger = createConsola({
  level: LEVELS[LEVEL],
  fancy: true,
  formatOptions: {
    columns: 80,
    colors: false,
    compact: false,
    date: false,
  },
});

/** Just a simple wrapper to enforce colors */
class Logger {
  newLine() {
    process.stdout.write("\n");
  }

  start(message) {
    baseLogger.start(message);
  }

  box(message) {
    process.stdout.write("\n");
    baseLogger.box(message);
  }

  prompt(message, options) {
    return baseLogger.prompt(message, options);
  }

  debug(message) {
    baseLogger.debug(chalk.gray.italic(message));
  }

  warn(message) {
    baseLogger.warn(chalk.yellow(message));
  }

  info(message) {
    baseLogger.info(message);
  }

  error(message) {
    baseLogger.error(chalk.red(message));
  }
}

const regularLogger = new Logger();

/**
 * No-op logger that does nothing - useful for tests
 */
class NoOpLogger {
  newLine() {}
  start() {}
  box() {}
  prompt() {}
  debug() {}
  warn() {}
  info() {}
  error() {}
  progress() {}
}

const noOpLogger = new NoOpLogger();

/**
 * Use NoOpLogger in test environment, regular logger otherwise
 */
const logger = process.env.NODE_ENV === "test" ? noOpLogger : regularLogger;

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

/**
 * In raw mode the terminal never raises SIGINT, so Ctrl+C during a prompt is
 * resolved by consola/clack as a cancel symbol rather than throwing or exiting.
 */
function isPromptCancelled(result) {
  return typeof result === "symbol";
}

export { logger, noOpLogger, callSilently, isPromptCancelled };
