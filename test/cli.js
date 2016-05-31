import test from 'ava';
import execa from 'execa';

process.chdir('../');

test('grunion', async t => {
  try {  // returns error
    await execa('./bin/grunion', ['./test/fixtures/*.js'], {preferLocal: true});
    t.fail();
  } catch (result) {
    t.regex(result.stdout, /ahhh/);
    t.regex(result.stdout, /boo/);
    t.false(/crap/.test(result.stdout));
    t.false(/damn/.test(result.stdout));
  }
});

test('grunion - fail-fast', async t => {
  try {
    await execa.shell('./bin/grunion "./test/fixtures/*.js" --fail-fast', {preferLocal: true});
    t.fail();
  } catch (e) {
    t.pass();
  }
});

test('grunion - babel', async t => {
  try {  // returns error
    await execa.shell('./bin/grunion "./test/fixtures/*.js" --run "babel-node <%= file.path %>"', {preferLocal: true});
    t.fail();
  } catch (result) {
    t.regex(result.stdout, /ahhh/);
    t.regex(result.stdout, /boo/);
    t.false(/crap/.test(result.stdout));
    t.regex(result.stdout, /damn/);
  }
});

test('grunion - babel - fail-fast', async t => {
  try {
    await execa.shell('./bin/grunion "./test/fixtures/*.js" --run "babel-node <%= file.path %>" --fail-fast', {preferLocal: true});
    t.fail();
  } catch (result) {
    t.regex(result.stderr, /Cannot read property 'is' of undefined/);
  }
});
