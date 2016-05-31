import grunion from '..';
import test from 'ava';

process.chdir('../');

test('grunion - all', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {showStdout: false, showStderr: false});
  t.is(r.success, 2);
  t.is(r.failed, 2);
});

test('grunion - all - fail-fast', async t => {
  try {
    await grunion(['./test/fixtures/*.js'], {showStdout: false, showStderr: false, failFast: true});
    t.fail();
  } catch (r) {
    t.is(r.failed, 1);
  }
});

test('grunion - all - babel-node', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {run: 'babel-node <%= file.path %>', showStdout: false, showStderr: false});
  t.is(r.success, 3);
  t.is(r.failed, 1);
});

test('grunion - all - echo', async t => {
  const r = await grunion(['./test/fixtures/*.js'], {run: 'echo <%= file.path %>', showStdout: false, showStderr: false});
  t.is(r.success, 4);
  t.is(r.failed, 0);
});

test('grunion - pass', async t => {
  const r = await grunion(['./test/fixtures/*-pass.js'], {showStdout: false, showStderr: false});
  t.is(r.success, 2);
  t.is(r.failed, 0);
});

test('grunion - fail', async t => {
  const r = await grunion(['./test/fixtures/*-fail.js'], {showStdout: false, showStderr: false});
  t.is(r.success, 0);
  t.is(r.failed, 1);
});
