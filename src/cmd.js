#!/usr/bin/env node
'use strict';

const debug = require('debug')('grunion');
const meow = require('meow');
const api = require('./api.js');

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
  --raw              Only write stdout and stderr (same as --no-headings --)

Examples
  grunion a.js b.js
  grunion test-*.js
  grunion -c "tape <%= file.path >" test-*.js --serial
  grunion -c "browserify <%= file.path > --im ./out/<%= file.basename >" ./src/*.js

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
      'raw': false
    },
    string: [
      '_',
      'run',
      'max'
    ],
    boolean: [
      'fail-fast',
      'local',
      'serial',
      'dry-run',
      'silent',
      'headings',
      'summary',
      'raw'
    ],
    alias: {
      s: 'serial',
      r: 'run',
      m: 'max'
    }
  });

const LF = '\n';
debug('Debugging enabled');

const opts = Object.assign({
  output
}, cli.flags);

if (opts.raw) {
  opts.headings = false;
  opts.summary = false;
  opts.silent = false;
}

function output(result) {
  if (opts.headings) {
    process.stdout.write(LF);
    process.stdout.write(`> ${result.file.path}`);
    process.stdout.write(LF);
    process.stdout.write(`> ${result.cmd}`);
    process.stdout.write(LF + LF);
  }
  if (!opts.silent) {
    process.stdout.write(clean(result.stdout));
    process.stderr.write(clean(result.stderr));
  }
}

function clean(text) {
  if (text.length > 0 && text[text.length - 1] !== '\n') {
    text += '\n';
  }
  return text;
}

function outputSumary(state) {
  if (opts.summary) {
    process.stdout.write(`${LF} - ${state.success} passed`);
    process.stdout.write(`${LF} - ${state.failed} failed`);
    process.stdout.write(`${LF} - ${state.pending} aborted`);
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

api(cli.input, opts)
  .then(r => {
    outputSumary(r);
    exit(r.failed > 0 ? 1 : 0);
  })
  .catch(r => {
    outputSumary(r);
    exit(1);
  });
