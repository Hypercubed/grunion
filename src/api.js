'use strict';

const path = require('path');
const globby = require('globby');
const shell = require('execa').shell;
const debug = require('debug')('grunion');
const template = require('lodash.template');
const Promise = require('bluebird');

// API defaults, may be different from CLI defaults
const defaults = {
  run: 'node <%= file.path %>',
  serial: false,
  local: true,
  failFast: false,
  max: 10,
  cache: false,
  output() {}
};

const EMPTY = {
  stdout: '',
  stderr: ''
};

module.exports = api;

function api(input, opts = {}) {
  opts = Object.assign({}, defaults, opts);

  const globbyOpts = {
    // TBD
  };

  const execaOpts = {
    preferLocal: opts.local,
    stripEof: false
  };

  const max = (opts.serial) ? 1 : Number(opts.max);

  if (typeof max !== 'number' || max < 1) {
    throw new Error('Invalid maximum number of children');
  }

  debug('Concurancy set to %s', max);

  const generateCmd = template(opts.run);

  const state = {
    failed: 0,
    success: 0,
    results: []
  };

  return Promise.resolve(globby(input, globbyOpts))
    .then(filepaths => {
      state.pending = filepaths.length;
      if (state.pending === 0 && !opts.silent) {
        console.error('Nothing to grun');
      }
      return filepaths;
    })
    .map(filepath => {
      const scope = {
        file: Object.assign(path.parse(filepath), {
          path: filepath
        })
      };

      scope.cmd = generateCmd(scope);

      debug('Running %s', scope.cmd);

      if (opts.dryRun) {
        state.success++;
        state.pending--;
        const result = Object.assign({}, EMPTY, scope);
        opts.output(result);
        debug('Finished dry-run %s', filepath);
        return null;
      }

      return shell(scope.cmd, execaOpts)
        .then(result => {
          debug('Finished %s', filepath);
          state.success++;
          state.pending--;
          result = Object.assign(result, scope);
          opts.output(result);
          state.results.push(opts.cache ? result : scope);
        })
        .catch(result => {
          debug('Failed %s', result);
          state.failed++;
          state.pending--;
          result = Object.assign({}, result, scope);
          opts.output(result);
          state.results.push(opts.cache ? result : scope);
          if (opts.failFast) {
            throw state;
          }
        });
    }, {concurrency: max})
    .then(() => {
      return state;
    });
}
