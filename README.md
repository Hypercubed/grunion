# Grunion

Run multiple commands using glob patterns.

## Why Grunion?

* Sometimes you want to run multiple commands in separate processes.
* node, babel-node only run one file at a time.
* tape, blue-tap run globs of files in a single process.
* AVA is not a generic runner.

## Features

* Runs one shell command per file, based on a glob.
* Defaults to running node.
* Use complex commands using template strings.
* Does require a bash script.

** Note: not yet tested on windows **

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
  --fail-fast        Stop after first failure
  --serial, -s       Run serially (same as -m 1)
  --max, -m          Maximum number of commands running at the same time
  --dry-run          Don't actually run each command (use with DEBUG=grunion)
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

TBD

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

Copyright (c) 2016 Jayson Harshbarger

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
