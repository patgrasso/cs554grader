const Runner          = require('../Runner');
const { spawnAsync }  = require('../utils');

module.exports = (path) => {
  const npmInstall = new Runner('npm-install');

  npmInstall.start(
    'npm install',

    async (_, opts) => {
      await spawnAsync(
        'npm', ['i'],
        { cwd: path, stdio: opts.verbose ? 'inherit' : 'pipe' }
      );
      return null;
    }
  );

  return npmInstall;
};
