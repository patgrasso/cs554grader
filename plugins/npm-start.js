const Runner    = require('../Runner');
const colors    = require('colors/safe');
const { spawn } = require('child_process');
const {
  spawnAsync,
  wait,
  colorize
}               = require('../utils');

module.exports = (path) => {
  const npmStart = new Runner('npm-start');

  npmStart.start(
    'npm start',

    (_, opts) => {
      let serverProcess = spawn(
        'npm',
        ['start'],
        { cwd: path, detached: true}
      );

      if (opts.verbose) {
        serverProcess.stdout.on('data', (data) => {
          process.stdout.write(colorize(data, opts.serverColor));
        });
        serverProcess.stderr.on('data', (data) => {
          process.stderr.write(colorize(data, opts.serverColor));
        });
      }

      return { serverProcess };
    }
  );

  npmStart.start(
    'wait 5 seconds',

    { quiet: true },

    () => wait(5000)
  );

  npmStart.cleanup(
    'kill #{serverProcess.pid}   # the server process',

    async (context) => {
      let proc = context.serverProcess;
      process.kill(-proc.pid);
      await new Promise((resolve) => proc.on('close', resolve));
    }
  );

  return npmStart;
};
