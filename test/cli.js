import test from 'ava';
import execa from 'execa';

process.chdir('../');

test('grunion - pass', async t => {
  const result = await execa(
    './bin/grunion',
    ['./test/fixtures/*-pass.js'],
    {preferLocal: true}
  );
  t.regex(result.stdout, /ahhh/);
  t.regex(result.stdout, /boo/);
  t.false(/crap/.test(result.stdout));
  t.false(/damn/.test(result.stdout));
});

test('grunion - fail', async t => {
  try {
    await execa('./bin/grunion',
     ['./test/fixtures/*.js'],
     {preferLocal: true}
   );
    t.fail();
  } catch (result) {
    t.regex(result.stdout, /ahhh/);
    t.regex(result.stdout, /boo/);
    t.false(/crap/.test(result.stdout));
    t.false(/damn/.test(result.stdout));
  }
});

test('grunion - fail - fail-fast', async t => {
  try {
    await execa(
      './bin/grunion',
      ['./test/fixtures/*.js', '--fail-fast'],
      {preferLocal: true}
    );
    t.fail();
  } catch (e) {
    t.pass();
  }
});

test('grunion - pass - babel-node', async t => {
  const result = await execa(
    './bin/grunion',
    ['./test/fixtures/*-pass.js', '--run', 'babel-node <%= file.path %>'],
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
      './bin/grunion',
      ['./test/fixtures/*.js', '--run', 'babel-node <%= file.path %>'],
      {preferLocal: true}
    );
    t.fail();
  } catch (result) {
    t.regex(result.stdout, /ahhh/);
    t.regex(result.stdout, /boo/);
    t.false(/crap/.test(result.stdout));
    t.regex(result.stdout, /damn/);
  }
});

test('grunion - fail - fail-fast babel-node', async t => {
  try {
    await execa(
      './bin/grunion',
      ['./test/fixtures/*.js', '--run', 'babel-node <%= file.path %>', '--fail-fast'],
      {preferLocal: true}
    );
    t.fail();
  } catch (result) {
    t.regex(result.stderr, /Cannot read property 'is' of undefined/);
  }
});

test('grunion - echo', async t => {
  const result = await execa(
    './bin/grunion',
    ['./test/fixtures/*.js', '--run', 'echo <%= file.path %>'],
    {preferLocal: true}
  );
  t.regex(result.stdout, /.\/test\/fixtures\/a-pass\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/b-pass\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/c-fail\.js/);
  t.regex(result.stdout, /.\/test\/fixtures\/d\.js/);
});

test('grunion - echo - serial', async t => {
  const result = await execa(
    './bin/grunion',
    ['./test/fixtures/*.js', '--run', 'echo <%= file.path %>', '--serial'],
    {preferLocal: true}
  );
  console.log(result);
  t.is(result.stdout, './test/fixtures/a-pass.js\n./test/fixtures/b-pass.js\n./test/fixtures/c-fail.js\n./test/fixtures/d.js');
});
