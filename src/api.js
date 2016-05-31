'use strict';
const path = require('path');
const globby = require('globby');
const execa = require('execa');
const debug = require('debug')('grunion');
const template = require('lodash.template');

const defaults = {
  run: 'node <%= file.path %>',
  serial: false,
  local: true,
  failFast: false,
  max: 10,
  showStdout: true,
  showStderr: true
};

module.exports = api;

function api(input, opts = {}) {
  opts = Object.assign({}, defaults, opts);

  const globbyOpts = {

  };

  const execaOpts = {
    preferLocal: opts.local
  };

  const max = (opts.serial) ? 1 : Number(opts.max);

  if (typeof max !== 'number' || max < 1) {
    throw new Error('Invalid maximum number of children');
  }

  debug('Concurancy set to %s', max);

  const compiledCmd = template(opts.run);

  const paths = globby.sync(input, globbyOpts);

  if (paths.length < 1) {
    throw new Error('Couldn\'t find any files to grun');
  }

  return new Promise(function (resolve, reject) {
    const state = {
      running: 0,
      failed: 0,
      success: 0
    };

    next();

    function next() {
      if (opts.failFast && state.failed > 0) {
        return reject(state);
      }
      if (state.running < max && paths.length > 0) {
        return run();
      }
      if (state.running === 0 && paths.length === 0) {
        resolve(state);
      }
    }

    function run() {
      const filepath = paths.shift();

      const file = Object.assign(path.parse(filepath), {
        path: filepath
      });

      const cmd = compiledCmd({
        file
      });

      state.running++;
      debug('Running %s', cmd);

      if (opts.dryRun) {
        state.running--;
        state.success++;
        debug('Finished dry-run %s', filepath);
        return next();
      }

      execa.shell(cmd, execaOpts)
        .then(result => {
          state.running--;
          state.success++;
          debug('Finished %s', filepath);
          if (opts.showStdout) {
            console.log(result.stdout);
          }
          return next();
        })
        .catch(result => {
          state.running--;
          state.failed++;
          debug('Failed %s', result);
          if (opts.showStdout) {
            console.log(result.stdout);
          }
          if (opts.showStderr) {
            console.error(result.stderr);
          }
          return next();
        });

      return next();
    }
  });
}
