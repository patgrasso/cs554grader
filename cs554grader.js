#! /usr/bin/env node

const path          = require('path');
const colors        = require('colors');
const Runner        = require('./Runner');
const plugins       = require('./plugins');
const { colorize }  = require('./utils');

require('yargs')
  .usage('Usage: $0 <command> [<args>]')
  .command(
    'unpack <zipfile>',
    'Unzips a submission and runs npm install',

    (yargs) => {
      yargs.usage(
`Usage: $0 unpack <zipfile>

This does 3 things:
  1) Unzips <zipfile> into a directory named using the first segment of the
     zipfile name, delimited by '_'.
  2) Recursively attempts to locate a package.json file within the unzipped
     directory. Moves all of the contents in the same directory as that
     package.json into the top level directory.
  3) Runs \`npm install\` in the top level directory`
      );

      yargs.version(false);

      yargs.example(
        '$0 unpack johndoe_lab1.zip',

        '- unzip johndoe_lab1.zip -d johndoe\n' +
        '- mv johndoe/nested/lab1/* johndoe/\n' +
        '- cd johndoe && npm install'
      );
    },

    async (argv) => {
      let [ studentName, late ] = path.basename(argv.zipfile).split('_');
      let outputDir = path.join(path.dirname(argv.zipfile), studentName);

      let unpack = new Runner('unpack', argv);

      unpack.use(plugins.unzip(argv.zipfile, outputDir, {
        bringModuleToSurface: true
      }));
      unpack.use(plugins.npmInstall(outputDir));

      await unpack.run();
    }
  );

require('yargs')
  .command(
    'grade [options] <submission>',
    'Runs tests on an unpacked submission',
    (yargs) => {
      yargs.usage(
`Usage: $0 grade [options] <submission>

Grades an assignment by running the submission with \`npm start\`, then
executing any of the plugins specified by the options below. Some plugins run
tests against the submission, while others are useful for setup/cleanup.`
      );

      yargs.example(
        '$0 grade johndoe \\\n  --mongo --mocha tests/lab1',

        '- cd johndoe && npm start\n' +
        '- mocha --recursive tests/lab1\n' +
        '- kill [pid of node server]\n' +
        '- mongo John-Doe-CS554-Lab1 --exec "db.dropDatabase()"'
      );

      yargs.version(false);

      yargs.option('mongo', {
        boolean: true,
        describe: 'destroy the mongo database created by the submission'
      });

      yargs.option('mocha', {
        string: true,
        requiresArg: true,
        describe: 'run a mocha suite after starting the submission'
      });

      yargs.option('server-color', {
        string: true,
        coerce: (s) => {
          let clrz = s.split(',');
          colorize('hey', clrz);
          return clrz;
        },
        requiresArg: true,
        describe: 'sets the output color for the server',
        choices: Object.keys(colors.styles)
      });
    },

    async (argv) => {
      const grade = new Runner('grade', argv);

      grade.use(plugins.npmStart(argv.submission));

      if (argv.mongo) {
        grade.use(plugins.mongo);
      }
      if (argv.mocha) {
        grade.use(plugins.mocha(argv.mocha));
      }

      await grade.run();
    }
  );

require('yargs')
  .command(
    'mongo-clean <pattern>',
    'Removes any mongo databases whose name matches the given pattern',

    (yargs) => {
      yargs.coerce('pattern', (pattern) => new RegExp(pattern));
      yargs.usage(
`Usage: $0 mongo-clean <pattern>

Removes any mongo databases whose name matches the given pattern`
      );
      yargs.version(false);
    },

    (argv) => plugins.mongo.clean(argv.pattern)
  );

require('yargs')
  .option('verbose', { alias: 'v', boolean: true })
  .demand(1, 'must provide a valid command')
  .help('h')
  .alias('h', 'help')
  .argv;
