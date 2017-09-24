const Runner          = require('../Runner');
const colors          = require('colors/safe');
const { spawn }       = require('child_process');
const { spawnAsync }  = require('../utils');

module.exports = (tests) => {
  const mocha = new Runner('mocha');

  mocha.test(
    `mocha ${tests} --recursive`,

    async (context, opts) => {
      let env = { ...process.env };

      for (let key in context) {
        env[key.toUpperCase()] = context[key].toString();
      }

      let proc = spawn('mocha', [tests, '--recursive'], { env });

      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);

      try {
        await new Promise((resolve, reject) => proc.on(
          'close', (e) => e === 0 ? resolve(e) : reject(e)));
      } catch (e) {
        console.error(colors.yellow.bold(`${e} tests failed`));
      }
    }
  );

  return mocha;
};
