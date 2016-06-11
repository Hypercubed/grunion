'use strict';

const path = require('path');
const globby = require('globby');
const shell = require('execa').shell;
const debug = require('debug')('grunion');
const template = require('lodash.template');
const {map, delay} = require('bluebird');

// API defaults, may be different from CLI defaults
const defaults = {
  run: 'node <%= file.path %>',
  serial: false,
  local: true,
  failFast: false,
  max: 10,
  cache: false,
  output() {},
  wait: 0
};

const EMPTY = {
  stdout: '',
  stderr: ''
};

module.exports = api;

async function api(input, opts = {}) {
  opts = {
    ...defaults,
    ...opts
  };

  const globbyOpts = {
    // TBD
  };

  const execaOpts = {
    preferLocal: opts.local,
    stripEof: false
  };

  const max = (opts.serial) ? 1 : Number(opts.max);
  const wait = (opts.wait) ? Number(opts.wait) : 0;

  if (typeof max !== 'number' || max < 1) {
    throw new Error('Invalid maximum number of children');
  }

  if (typeof wait !== 'number' || wait < 0) {
    throw new Error('Invalid wait time');
  }

  debug('Concurancy set to %s', max);
  debug('Delay between runs set to %s', wait);

  const generateCmd = template(opts.run);

  const filepaths = await globby(input, globbyOpts);

  let failed = 0;
  let success = 0;
  let aborted = filepaths.length;
  if (aborted === 0 && !opts.silent) {
    console.error('Nothing to grun');
  }

  try {
    const results = await map(filepaths, grun, {concurrency: max});
    return {
      aborted,
      success,
      failed,
      results
    };
  } catch (e) {
    throw e;
  }

  async function grun(filepath) {
    const scope = {
      file: {
        path: filepath,
        ...path.parse(filepath)
      }
    };

    scope.cmd = generateCmd(scope);

    debug('Running %s', scope.cmd);

    if (opts.dryRun) {
      success++;
      aborted--;
      scope.failed = false;
      const result = {
        ...EMPTY,
        ...scope
      };
      opts.output(result);
      debug('Finished dry-run %s', filepath);
      return result;
    }

    let result = null;
    try {
      result = await shell(scope.cmd, execaOpts);
      debug('Finished %s', filepath);
      success++;
      aborted--;
      scope.failed = false;
      result = {
        ...result,
        ...scope
      };
      opts.output(result);
    } catch (err) {
      debug('Failed %s', err);
      failed++;
      aborted--;
      scope.failed = true;
      result = {
        ...err,
        ...scope
      };
      opts.output(result);
      if (opts.failFast) {
        const state = {
          aborted,
          success,
          failed
        };
        throw state;
      }
    }

    if (wait && wait > 0) {
      await delay(wait);
    }

    return opts.cache ? result : scope;
  }
}
