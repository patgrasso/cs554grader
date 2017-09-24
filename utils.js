const colors    = require('colors');
const { spawn } = require('child_process');

const spawnAsync = (...args) => new Promise(
  (resolve, reject) => spawn(...args)
    .on('close', (e) => e === 0 ? resolve(e) : reject(e))
);

async function wait(time) {
  return new Promise((resolve) => setTimeout(() => resolve(), time));
}

async function spawnThenStdout(...args) {
  return new Promise((resolve, reject) => {
    let output = '';
    let cmd = spawn(...args);

    cmd.stdout.on('data', (data) => output += data.toString());
    cmd.on(
      'close',
      (e) => {
        if (e !== 0) {
          return reject(e);
        }
        return resolve(output.split('\n').slice(0, -1));
      }
    );
  });
}

async function find(dir, filename) {
  return spawnThenStdout('find', [ dir, '-name', filename, '-print' ]);
}

function colorize(string, pigments) {
  if (!Array.isArray(pigments) && typeof colors === 'string') {
    pigments = [ colors ];
  }
  if (!Array.isArray(pigments)) {
    throw new TypeError('Expected an array of pigments');
  }

  let invalidColors = pigments.filter((color) => !colors[color]);

  if (invalidColors.length > 0) {
    throw new TypeError(`[${invalidColors}] are not valid colors`);
  }

  return pigments.reduce((colorFn, color) => colorFn[color], colors)(string);
}

module.exports = { spawnAsync, wait, find, colorize };
