#!/usr/bin/env node
'use strict';

const debug = require('debug')('grunion');
const meow = require('meow');
const api = require('..');

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
      'max': 10
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
      'dry-run'
    ],
    alias: {
      s: 'serial',
      r: 'run',
      m: 'max'
    }
  });

debug('Debugging enabled');

api(cli.input, cli.flags)
  .then(r => {
    process.exit(r.failed > 0 ? 1 : 0);
  })
  .catch(() => {
    process.exit(1);
  });
