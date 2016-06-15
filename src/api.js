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
  delay: 0,
  globby: {},
  execa: {
    preferLocal: true,
    stripEof: false
  }
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

  opts.delay = (opts.delay) ? Number(opts.delay) : 0;
  opts.generateCmd = template(opts.run);
  opts.execa.preferLocal = opts.local;
  opts.map = {
    concurrency: opts.serial ? 1 : Number(opts.max)
  };

  if (typeof opts.map.concurrency !== 'number' || opts.map.concurrency < 1) {
    throw new Error('Invalid maximum number of children');
  }

  if (typeof opts.delay !== 'number' || opts.delay < 0) {
    throw new Error('Invalid wait time');
  }

  debug('Concurancy set to %s', opts.map.concurrency);
  debug('Delay between runs set to %s', opts.delay);

  const filepaths = await globby(input, opts.globby);

  if (filepaths.length === 0 && !opts.silent) {
    console.error('Nothing to grun');
  }

  const tasks = filepaths.map(filepath => ({
    file: {
      path: filepath,
      ...path.parse(filepath)
    },
    pending: true
  }));

  try {
    const results = await map(tasks, task => grun(task, opts), opts.map);
    return summarize(results);
  } catch (e) {
    throw summarize(tasks);
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

async function grun(task, opts) {
  task.cmd = opts.generateCmd(task);
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
      result = await shell(task.cmd, opts.execa);
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

  if (opts.delay && opts.delay > 0) {
    await delay(opts.delay);
  }

  return opts.cache ? result : task;
}
