# Grunion

Run multiple commands using glob patterns.

[![version](https://img.shields.io/npm/v/grunion.svg)](https://www.npmjs.org/package/grunion)
[![status](https://travis-ci.org/Hypercubed/grunion.svg)](https://travis-ci.org/Hypercubed/grunion)
[![dependencies](https://david-dm.org/Hypercubed/grunion.svg)](https://david-dm.org/Hypercubed/grunion)
[![devDependencies](https://david-dm.org/Hypercubed/grunion/dev-status.svg)](https://david-dm.org/Hypercubed/grunion#info=devDependencies)
![node](https://img.shields.io/node/v/grunion.svg)

## Why Grunion?

* Sometimes you want to run multiple scripts in separate processes.
* node, babel-node only run one file at a time.
* tape and blue-tap run globs of files in a single process.
* AVA is not a generic runner.

## Features

* Runs one shell command per file, based on a extended `glob` (see [globby](https://github.com/sindresorhus/globby#globbing-patterns)).
* Defaults to running node concurrently.
* Use complex commands using template strings.
* Doesn't require bash scripts.
* Prefers locally installed binaries by default (see [execa](https://github.com/sindresorhus/execa#preferlocal)).
* Promise API interface.

**Tested on mac, windows cmd, and cygwin**

## Install

```sh
npm install -g grunion
```

## CLI Usage

```
Usage
  grunion [<file|directory|glob> ...]

Options,

  --run, -r          Command template to run (default: "node <%= file.path %>")
  --fail-fast        Stop after first failure (default: false)
  --serial, -s       Run serially (same as -m 1, default: false)
  --max, -m          Maximum number of commands running at the same time (default: 10)
  --dry-run          Don't actually run each command (use with DEBUG=grunion, default: false)
  --local            Prefer locally installed binaries (default: true)
  --silent           Don't write output (default: false)
  --headings         Write the file names and commands (default: true)
  --summary          Write the summary (default: true)
  --raw, -w          Only write stdout and stderr (same as --no-headings --no-summary --silent)
  --delay            Delay N ms between runs (default: 0)  
```

Examples:

```sh
grunion a.js b.js
```

Runs node on `a.js` and `b.js`, each in a separate node process.

```sh
grunion *.js # same as grunion *.js -m 10
```

Runs node on each file matching `*.js`, up to 10 at a time.

```sh
grunion *.js --serial # same as grunion *.js -m 1
```

Runs node on each file matching `*.js` sequentially.

```sh
grunion --run "babel-node <%= file.path %>" *.js -m 3
```

Runs babel-node on each file matching `*.js`, up to 3 at a time.

```sh
grunion --run "browserify <%= file.path > --im ./out/<%= file.basename >" ./src/*.js
```

Runs browserify on each file matching `/src/*.js` with output to `/out/*.js`.

## API

TBR

## Recipes

Coming soon...

## Things that go well with Grunion

- [Tape](https://github.com/substack/tape)
- [Blue-tape](https://www.npmjs.com/package/blue-tape)
- [babel-tape-runner](https://github.com/wavded/babel-tape-runner)
- [babel-cli](https://github.com/babel/babel/tree/master/packages)
- [Browserify](https://github.com/substack/node-browserify)
- [Testling](https://github.com/substack/testling)

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

Copyright (c) 2016 Jayson Harshbarger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
