const path    = require('path');
const fs      = require('fs');
const colors  = require('colors');
const Runner  = require('../Runner');
const {
  spawnAsync,
  find
}             = require('../utils');

module.exports = (zipFile, outputDir, opts) => {
  const unzip = new Runner('unzip');

  unzip.start(
    `unzip ${zipFile} -d ${outputDir}`,

    (_, opts) => spawnAsync(
      'unzip',
      ['-o', zipFile, '-d', outputDir],
      { stdio: opts.verbose ? 'inherit' : 'pipe' }
    )
  );

  if (opts.bringModuleToSurface) {
    unzip.start(
      'move unzipped content to top level',

      async (context) => {
        let dir = outputDir;
        let sourceDir = path.dirname(
          (await find(dir, 'package.json')).slice(-1)[0]
        );
        let sourceFiles = fs
              .readdirSync(sourceDir)
              .map((file) => path.join(sourceDir, file));

        if (path.resolve(sourceDir) === path.resolve(dir)) {
          return null;
        }

        console.log(colors.yellow.bold(
          `mv ${sourceDir}/* ${sourceDir}/.* ${dir}`
        ));
        await spawnAsync('mv', sourceFiles.concat(dir), { stdio: 'inherit' });
        return null;
      }
    );
  }

  return unzip;
};
