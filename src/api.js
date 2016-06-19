'use strict';

const path = require('path');
const globby = require('globby');
const {shell} = require('execa');
const template = require('lodash.template');
const {mapSeries, map, delay} = require('bluebird');

// API defaults, may be different from CLI defaults
const defaults = {
  run: 'node <%= file.path %>',
  serial: false,
  local: true,
  failFast: false,
  max: 10,
  cache: false,
  output() {},
  outputBefore() {},
  delay: 0,
  globby: {},
  execa: {
    preferLocal: true,
    stripEof: false
  }
};

/* {
  'run': 'node <%= file.path %>',
  'serial': false,
  'local': true,
  'fail-fast': false,
  'dry-run': false,
  'max': 10,
  'silent': false,
  'headings': true,
  'summary': true,
  'raw': false,
  'delay': 0,
  'spinner': true
} */

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
    const _map = opts.map.concurrency > 1 ? map : mapSeries;
    const results = await _map(tasks, task => grun(task, opts, tasks), opts.map);
    return summarize(results);
  } catch (err) {
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
    results: results
  });
}

async function grun(task, opts, tasks) {
  task.cmd = opts.generateCmd(task);
  let result;

  opts.outputBefore(task, tasks);

  if (opts.dryRun) {
    task.pending = false;
    task.failed = false;
    result = {
      ...EMPTY,
      ...task,
      dryrun: true
    };
    opts.output(result);
  } else {
    try {
      result = await shell(task.cmd, opts.execa);
      task.pending = false;
      task.failed = false;
      result = {
        ...result,
        ...task
      };
      opts.output(result);
    } catch (err) {
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
