import test from 'ava';
import grunion from '../src/api';

process.chdir('../');

test('grunion - all', async t => {
  const r = await grunion(['./test/fixtures/*.js']);
  t.is(r.success, 2);
  t.is(r.failed, 2);
});

test('grunion - all - fail-fast', async t => {
  try {
    await grunion(['./test/fixtures/*.js'], {failFast: true, serial: true});
    t.fail();
  } catch (r) {
    t.is(r.failed, 1);
    t.is(r.success, 1);
    t.is(r.aborted, 2);
  }
});

test('grunion - all - babel-node', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {run: 'babel-node <%= file.path %>'});
  t.is(r.success, 3);
  t.is(r.failed, 1);
});

test('grunion - all - echo', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {run: 'echo <%= file.path %>'});
  t.is(r.success, 4);
  t.is(r.failed, 0);
});

test('grunion - pass', async t => {
  const r = await grunion(['./test/fixtures/*-pass.js']);
  t.is(r.success, 2);
  t.is(r.failed, 0);
});

test('grunion - fail', async t => {
  const r = await grunion(['./test/fixtures/*-fail.js']);
  t.is(r.success, 0);
  t.is(r.failed, 1);
});

test('grunion - cache', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {run: 'echo <%= file.base %>', cache: true});
  t.is(r.success, 4);
  t.is(r.failed, 0);
  t.deepEqual(r.results.map(d => d.stdout), ['a-pass.js\n', 'b-pass.js\n', 'c-fail.js\n', 'd.js\n']);
});

// TODO: acutally test delay
test('grunion - wait', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {run: 'echo <%= file.base %>', serial: true, delay: 100});
  t.is(r.success, 4);
  t.is(r.failed, 0);
});

// TODO: acutally test delay
test('grunion - wait - max 2', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {run: 'echo <%= file.base %>', max: 2, delay: 100});
  t.is(r.success, 4);
  t.is(r.failed, 0);
});
