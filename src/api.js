'use strict';

const path = require('path');
const globby = require('globby');
const {shell} = require('execa');
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
  delay: 0
};

const EMPTY = {
  stdout: '',
  stderr: ''
};

module.exports = async function grunion(input, opts = {}) {
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

  const mapOpts = {
    concurrency: opts.serial ? 1 : Number(opts.max)
  };

  if (typeof mapOpts.concurrency !== 'number' || mapOpts.concurrency < 1) {
    throw new Error('Invalid maximum number of children');
  }

  const wait = (opts.delay) ? Number(opts.delay) : 0;

  if (typeof wait !== 'number' || wait < 0) {
    throw new Error('Invalid wait time');
  }

  debug('Concurancy set to %s', mapOpts.concurrency);
  debug('Delay between runs set to %s', wait);

  const filepaths = await globby(input, globbyOpts);

  if (filepaths.length === 0 && !opts.silent) {
    console.error('Nothing to grun');
  }

  const generateCmd = template(opts.run);

  const tasks = filepaths.map(filepath => ({
    file: {
      path: filepath,
      ...path.parse(filepath)
    },
    pending: true
  }));

  try {
    const results = await map(tasks, grun, mapOpts);
    return summarize(results);
  } catch (e) {
    throw summarize(tasks);
  }

  async function grun(task) {
    task.cmd = generateCmd(task);
    let result;

    debug('Running %s', task.cmd);

    if (opts.dryRun) {
      task.pending = false;
      task.failed = false;
      result = {
        ...EMPTY,
        ...task
      };
      opts.output(result);
      debug('Finished dry-run %s', task.file.path);
    } else {
      try {
        result = await shell(task.cmd, execaOpts);
        debug('Finished %s', task.file.path);
        task.pending = false;
        task.failed = false;
        result = {
          ...result,
          ...task
        };
        opts.output(result);
      } catch (err) {
        debug('Failed %s', err);
        task.pending = false;
        task.failed = true;
        result = {
          ...err,
          ...task
        };
        opts.output(result);
        if (opts.failFast) {
          throw opts.cache ? result : task;
        }
      }
    }

    if (wait && wait > 0) {
      await delay(wait);
    }

    return opts.cache ? result : task;
  }
};

function summarize(results) {
  return results.reduce((p, r) => {
    p.aborted += Number(r.pending);
    if (typeof r.failed === 'boolean') {
      p.failed += Number(r.failed);
      p.success += Number(!r.failed);
    }
    return p;
  }, {
    aborted: 0,
    success: 0,
    failed: 0,
    results
  });
}
