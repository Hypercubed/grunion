import test from 'ava';
import execa from 'execa';

process.chdir('../');

const bin = './dist/cmd.js';

test('grunion - pass', async t => {
  const result = await execa(
    bin,
    ['./test/fixtures/quick/*-pass.js'],
    {preferLocal: true}
  );
  t.regex(result.stdout, /ahhh/);
  t.regex(result.stdout, /boo/);
  t.false(/crap/.test(result.stdout));
  t.false(/damn/.test(result.stdout));
});

test('grunion - fail', async t => {
  try {
    await execa(bin,
     ['./test/fixtures/quick/*.js'],
     {preferLocal: true}
   );
    t.fail();
  } catch (err) {
    t.regex(err.stdout, /ahhh/);
    t.regex(err.stdout, /boo/);
    t.false(/crap/.test(err.stdout));
    t.false(/damn/.test(err.stdout));
  }
});

test('grunion - fail - fail-fast', async t => {
  try {
    await execa(
      bin,
      ['./test/fixtures/quick/*.js', '--fail-fast'],
      {preferLocal: true}
    );
    t.fail();
  } catch (err) {
    t.pass();
  }
});

test('grunion - pass - babel-node', async t => {
  const result = await execa(
    bin,
    ['./test/fixtures/quick/*-pass.js', '--run', 'babel-node <%= file.path %>'],
    {preferLocal: true}
  );
  t.regex(result.stdout, /ahhh/);
  t.regex(result.stdout, /boo/);
  t.false(/crap/.test(result.stdout));
  t.false(/damn/.test(result.stdout));
});

test('grunion - fail - babel-node', async t => {
  try {  // returns error
    await execa(
      bin,
      ['./test/fixtures/quick/*.js', '--run', 'babel-node <%= file.path %>'],
      {preferLocal: true}
    );
    t.fail();
  } catch (err) {
    t.regex(err.stdout, /ahhh/);
    t.regex(err.stdout, /boo/);
    t.false(/crap/.test(err.stdout));
    t.regex(err.stdout, /damn/);
  }
});

test('grunion - fail - fail-fast babel-node', async t => {
  try {
    await execa(
      bin,
      ['./test/fixtures/quick/*.js', '--run', 'babel-node <%= file.path %>', '--fail-fast'],
      {preferLocal: true}
    );
    t.fail();
  } catch (err) {
    t.regex(err.stderr, /Cannot read property 'is' of undefined/);
  }
});

test('grunion - echo', async t => {
  const result = await execa(
    bin,
    ['./test/fixtures/quick/*.js', '--run', 'echo <%= file.path %>'],
    {preferLocal: true}
  );
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/a-pass\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/b-pass\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/c-fail\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/d\.js/);
});

test('grunion - echo - serial', async t => {
  const result = await execa(
    bin,
    ['./test/fixtures/quick/*.js', '--run', 'echo <%= file.path %>', '--serial'],
    {preferLocal: true}
  );
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/a-pass\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/b-pass\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/c-fail\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/quick\/d\.js/);
});
