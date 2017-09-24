# CS 554 Grader

## Install
```
npm i -g cs554grader
```

## Run
Run this like any other command (if you installed it globally).
```sh
cs554grader <unpack|grade|mongo-clean|...> [<args>]

# Find out what it cand do:
cs554grader --help

# Or learn about a certain sub-command:
cs554grader unpack --help
```

Commonly, the sequence in which this will be used goes as follows:
```sh
cs554grader unpack johndoe_12345_4324234_John_Doe_CS554_Assignment.zip
# 1. unzips the submission into ./johndoe
# 2. if the actual project is nested (e.g. ./johndoe/nested/lab1/package.json),
#    it moves these files up into ./johndoe
# 3. runs npm install inside ./johndoe

cs554grader grade johndoe --mocha <test suite>
# 1. npm start inside ./johndoe
# 2. mocha <test suite> --recursive
# 3. kill <server pid from npm start>

# Manually review output & make a grade report
```


## Plugins
You can create your own plugin to use with the grader. All plugins are instances
of `Runner` (Runner.js). Every subcommand (e.g. unpack, grade) and every step in
the grading process is a "plugin".

The grading lifecycle has several steps that execute in order (kind of like a
travis-ci build):
  - beforeStart
  - start
  - beforeTest
  - test
  - afterSuccess
  - afterFailure
  - cleanup
  
All of these steps are methods in `Runner`.

```javascript
Runner.prototype[lifecyclePhase] = function (title, [opts], fn) { };
```

- `title`: A short description of whatever `fn` does.
- `[opts]`: Options (see a little bit further down). You can also omit this and
  just give a title + function.
- `fn`: Function that takes two arguments, `(context, opts)`, and returns an
  object. Whatever is in the returned object will be assigned to the context, so
  you can access things in a later lifecycle method.
  
Example:
```javascript
// timer.js
const timer = new Runner('timer');

timer.beforeStart(
  'mark start time',
  
  (context, opts) => {
    return {
      startTime: Date.now()
    };
  }
);

timer.afterSuccess(
  'report total execution time',

  (context, opts) => {
    console.log('Time elapsed: %ds', (Date.now() - context.startTime) / 1000);
  }
);

module.exports = timer;
```

Output (as if it were used with `cs554grader grade project --mocha tests`):
```
1. mark start time
2. npm start

> project@1.0.0 start /path/to/project
> node app.js

3. mocha tests/for/project --recursive
4. report total execution time
Time elapsed: 10.434s
5. kill 12345   # the server process
```


### Options
`opts` currently supports:
- `quiet`: Do not print out the step when it executes (normally, the step is
  printed as "n. <title>")


### Using plugins
To use your shiny new `Runner`, it has to be `.use()`'d by another `Runner`.
Remember how unpack and grade are runners themselves?

```javascript
const unpack = new Runner('unpack');
const timer = require('./timer.js');

unpack.use(timer);
```

`unpack` will inherit all of the functions registered to each lifecycle within
`timer`. If unpack already has things registered to a phase, the things
inherited from timer will go after those.

Example:

**unpack** (before calling `unpack.use(timer)`)
- beforeStart
  - unzip
  - bubble module to top
- start
  - npm install

**timer**
- beforeStart
  - start timer
- afterSuccess
  - report total time

`unpack.use(timer)`

**unpack** (after calling `unpack.use(timer)`)
- beforeStart
  - unzip
  - bubble module to top
  - start timer
- start
  - npm install
- afterSuccess
  - report total time


## Future additions
- Local plugin registration `cs554grader register myplugin/`.
  Get description from myplugin/package.json.
  Have registered plugins show up alongside pre-packaged ones like --mongo.
  For now, given the scope, just adding to plugins/ will be sufficient.
  
- Automatic report generation.

- Automatic point tallying (requires some way of neatly assigning points).


<p align="center">
  <img alt="xkcd automation comic" src="https://imgs.xkcd.com/comics/automation.png" />
</p>
