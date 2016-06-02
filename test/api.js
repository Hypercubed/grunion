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
    const r = await grunion(['./test/fixtures/*.js'], {failFast: true});
    console.log(r);
    t.fail();
  } catch (r) {
    t.is(r.failed, 1);
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
