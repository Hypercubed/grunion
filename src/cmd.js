#!/usr/bin/env node
'use strict';

const debug = require('debug')('grunion');
const meow = require('meow');
const ora = require('ora');
const figures = require('figures');

const api = require('./api');

const cli = meow(`
Usage
  grunion [<file|directory|glob> ...]

Options,

  --run, -r          Command template to run (default: "node <%= file.path %>")
  --fail-fast        Stop after first failure (default: false)
  --serial, -s       Run serially (same as -m 1, default: false)
  --max, -m          Maximum number of commands running at the same time (default: 10)
  --dry-run          Don't actually run each command (use with DEBUG=grunion, default: false)
  --local            Prefer locally installed binaries (default: true)
  --silent           Don't write output (default: falues)
  --headings         Write the file names and commands (default: true)
  --summary          Write the summary (default: true)
  --raw, -w          Only write stdout and stderr (same as --no-headings --no-summary --silent)
  --delay            Delay N ms between runs (default: 0)

Examples
  grunion a.js b.js
  grunion test-*.js
  grunion -r "tape <%= file.path >" test-*.js --serial
  grunion -r "browserify <%= file.path > --im ./out/<%= file.basename >" ./src/*.js

  `,
  {
    default: {
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
    },
    string: [
      '_',
      'run',
      'max',
      'delay'
    ],
    boolean: [
      'fail-fast',
      'local',
      'serial',
      'dry-run',
      'silent',
      'headings',
      'summary',
      'raw',
      'spinner'
    ],
    alias: {
      s: 'serial',
      r: 'run',
      m: 'max',
      w: 'raw'
    }
  });

const LF = '\n';
debug('Debugging enabled');

const opts = Object.assign({
  output,
  onStart
}, cli.flags);

if (opts.raw) {
  opts.headings = false;
  opts.summary = false;
  opts.silent = false;
  opts.spinner = false;
}

opts.max = opts.serial ? 1 : Number(opts.max);
opts.delay = (opts.delay) ? Number(opts.delay) : 0;

const spinner = opts.spinner ? ora('Grunning').start() : null;

debug('Concurancy set to %s', opts.max);
debug('Delay between runs set to %s', opts.delay);

api(cli.input, opts)
  .then(r => {
    outputSumary(r);
    exit(r.failed > 0 ? 1 : 0);
  })
  .catch(err => {
    outputSumary(err);
    exit(1);
  });

function onStart(task, index, tasks) {
  if (spinner) {
    spinner.clear();
  }
  debug('Grunning %s', task.cmd);
  if (spinner) {
    spinner.text = `Grunning #${index + 1}/${tasks.length} ${figures.pointer} ${task.cmd}`;
    spinner.render();
  }
}

function output(task, index, tasks) {
  if (spinner) {
    spinner.clear();
  }

  const sym = getSymbol(task);

  if (debug.enabled) {
    if (task.dryrun) {
      debug('%s Finished dry-run %s', sym, task.file.path);
    } else if (task.failed) {
      debug('%s Failed running %s', sym, task.file.path);
    } else {
      debug('%s Finished running %s', sym, task.file.path);
    }
  }

  if (opts.headings) {
    process.stdout.write(`${figures.pointer} ${task.file.path}`);
    process.stdout.write(LF);
  }
  if (!opts.silent) {
    process.stdout.write(LF);
    process.stdout.write(clean(task.stdout));
    process.stderr.write(clean(task.stderr));
    process.stdout.write(LF);
  }
  if (opts.headings) {
    process.stdout.write(`${sym} ${task.cmd}`);
    process.stdout.write(LF + LF);
  }

  if (spinner) {
    spinner.text = count(tasks);
    spinner.render();
  }
}

function getSymbol(result) {
  if (result.pending) {
    return figures.pointer;
  } else if (result.failed) {
    return figures.cross;
  }
  return figures.tick;
}

function clean(text) {
  if (text.length > 0 && text[text.length - 1] !== '\n') {
    text += '\n';
  }
  return text;
}

function outputSumary(state) {
  spinner.stop();
  if (opts.summary) {
    process.stdout.write(`${LF} - ${state.success} passed`);
    process.stdout.write(`${LF} - ${state.failed} failed`);
    process.stdout.write(`${LF} - ${state.aborted} aborted`);
    process.stdout.write(LF);
  }
}

function exit(code) {
  // flush
  if (code > 0) {
    process.stdout.write('');
    process.stderr.write('');

    setTimeout(function () {
      process.exit(code);
    }, 500);
  }
}

function count(tasks) {
  const summary = tasks.reduce((p, r) => {
    p.pending += Number(r.pending);
    if (typeof r.failed === 'boolean') {
      p.failed += Number(r.failed);
      p.finished += Number(!r.finished);
    }
    return p;
  }, {
    pending: 0,
    finished: 0,
    failed: 0
  });

  return `pending: ${summary.pending}, finished: ${summary.finished}, failed: ${summary.failed}`;
}
