import readline from "readline";
import chalk from "chalk";
import { createConsola } from "consola";

const LEVELS = {
	fatal: 0,
	error: 1,
	warn: 2,
	info: 3,
	debug: 4,
	trace: 5,
	silent: -999,
	verbose: 999
}

const baseLogger = createConsola({
  level: LEVELS[process.env.LOG_LEVEL] || LEVELS["info"],
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
		baseLogger.prompt(message, options);
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

export {logger};
