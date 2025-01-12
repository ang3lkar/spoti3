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

export const logger = createConsola({
  level: LEVELS[process.env.LOG_LEVEL] || LEVELS["info"],
  fancy: true,
  formatOptins: {
      columns: 80,
      colors: false,
      compact: false,
      date: false,
  },
});
