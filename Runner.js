const colors = require('colors/safe');

function lifeCycleMethod(step, title, opts, fn) {
  if (fn == null && typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  this.lifecycle[step].push({ title, opts, fn });
}

const interpolate = (string, vars) => string.replace(
  /#{(.*?)}/g,
  (_, key) => key.split('.').reduce((val, part) => val[part], vars)
);

const LIFE_CYCLE = [
  'beforeStart',
  'start',
  'beforeTest',
  'test',
  'afterSuccess',
  'afterFailure',
  'cleanup'
];

class Runner {

  constructor(name, opts={}) {
    this.name = name;
    this.opts = opts;
    this.lifecycle = {};

    LIFE_CYCLE.forEach((step) => this.lifecycle[step] = []);
  }

  use(plugin) {
    if (!(plugin instanceof Runner)) {
      throw new TypeError(`${plugin} is not a Runner`);
    }

    LIFE_CYCLE.forEach((step) => {
      this.lifecycle[step].push(...plugin.lifecycle[step]);
    });

    Object.assign(this.opts, plugin.opts);
  }

  async run() {
    let counter = 1;
    let promise = Promise.resolve({});

    for (let phase of LIFE_CYCLE) {
      for (let step of this.lifecycle[phase]) {
        promise = promise.then(async (context) => {
          // Don't output this as a "step" if quiet option is truthy
          if (!step.opts.quiet) {
            let formattedTitle = interpolate(step.title, context);
            console.log(colors.green.bold(`${counter++}. ${formattedTitle}`));
          }

          try {
            let newContext = await step.fn(context, this.opts);

            if (typeof newContext === 'object') {
              Object.assign(context, newContext);
            }
          } catch (e) {
            console.error(colors.red.bold(e));
            throw e;
          }
          return context;
        });
      }
    }
    return promise;
  }

}

LIFE_CYCLE.forEach((step) => {
  let fn = function (...args) {
    return lifeCycleMethod.call(this, step, ...args);
  };
  fn.name = step;
  Runner.prototype[step] = fn;
});

module.exports = Runner;
