const Runner          = require('../Runner');
const colors          = require('colors/safe');
const { spawn }       = require('child_process');
const { spawnAsync }  = require('../utils');

async function listDatabases(pattern=/./) {
  return new Promise((resolve, reject) => {
    let mongoCmd = spawn(
      'mongo',
      [
        '--quiet',
        '--eval',
        `db.adminCommand({ listDatabases: 1 })
         .databases
         .forEach((database) => print(database.name))`
      ]
    );

    let output = '';
    mongoCmd.stdout.on('data', (data) => output += data.toString());
    mongoCmd.on(
      'close',
      (e) => {
        if (e !== 0) {
          return reject(e);
        }
        return resolve(
          output
            .split('\n')
            .slice(0, -1)
            .map((dbName) => dbName.trim())
            .filter((dbName) => pattern.test(dbName))
        );
      }
    );
  });
}

async function dropDatabase(database) {
  return spawnAsync(
    'mongo',
    [database, '--quiet', '--eval', 'db.dropDatabase()']
  );
}

const mongo = new Runner('mongo');

mongo.beforeStart(
  'list mongo databases',

  { quiet: true },

  async () => ({
    dbsBeforeStart: await listDatabases()
  })
);

mongo.cleanup(
  'look for mongo db created',

  { quiet: true },

  async (context) => {
    let { dbsBeforeStart } = context;
    let dbsAfterStart = await listDatabases();

    let newDbs = dbsAfterStart.filter(
      (dbName) => !dbsBeforeStart.includes(dbName));

    if (newDbs.length <= 0) {
      console.log(colors.yellow.bold('No mongo database created during start'));
      return 1;
    } else {
      return { dbName: newDbs[0] };
    }
  }
);

mongo.cleanup(
  'mongo #{dbName} --eval \'db.dropDatabase()\'',

  async ({ dbName }) => dropDatabase(dbName)
);

mongo.clean = async (pattern) => Promise.all(
  (await listDatabases(pattern)).map(
    (db) => {
      console.log('Dropping', db);
      return dropDatabase(db);
    }));

module.exports = mongo;
