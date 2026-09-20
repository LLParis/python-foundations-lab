'use strict';
// Tooling checks only. Fixtures are not learner exercises or progress.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const core = require('./vscode-extension/core.cjs');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'arena-tool-check-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  core.writeJson(path.join(root, 'arena.json'), {version: 1});
  core.newExercise(root, 'Tool fixture', 'Tool verification only.');
  core.write(core.current(root).code, 'print("fixture")\n');
  core.write(path.join(root, 'PROGRESS.md'), 'No learning claim.\n');
  return root;
}
test('capture preserves exact code, prompt, notes, and previous attempts', t => {
  const root = fixture(t), c = core.current(root);
  const draft = '# naïve draft\nprint("first")\n\n   ';
  core.write(c.code, draft);
  const first = core.capture(root, 'Not specified');
  core.write(c.code, 'print("revision")\n');
  const second = core.capture(root, 'Hint or explanation used');
  assert.equal(core.read(path.join(first.directory, 'attempt.py')), draft);
  assert.notEqual(first.directory, second.directory);
  assert.equal(first.metadata.assessment, 'ungraded');
  assert.equal(core.read(path.join(first.directory, 'prompt.md')), core.read(c.prompt));
  assert.match(first.packet, /Not run by the arena runner/);
});
test('copy packet excludes stale output and safely fences embedded backticks', t => {
  const root = fixture(t), c = core.current(root);
  core.write(c.code, '# ```\nprint("now")\n');
  core.writeJson(path.join(root, '.arena/runs', c.exercise + '.json'), {exercise:c.exercise,sha256:core.hash('old'),output:'STALE_SECRET'});
  const result = core.capture(root, 'No help on this attempt');
  assert.match(result.packet, /different code/);
  assert.doesNotMatch(result.packet, /STALE_SECRET/);
  assert.match(result.packet, /````python/);
});
test('new exercises and revisit preserve prior work; traversal is rejected', t => {
  const root = fixture(t), previous = core.current(root);
  const next = core.newExercise(root, 'Changed requirement', 'Fresh task');
  assert.equal(core.read(previous.code), 'print("fixture")\n');
  assert.notEqual(next.exercise, previous.exercise);
  core.selectExercise(root, previous.exercise);
  assert.equal(core.current(root).exercise, previous.exercise);
  assert.throws(() => core.selectExercise(root, '../../elsewhere'));
  assert.throws(() => core.inside(root, '../escape'));
});
test('checkpoint commits only current practice and refuses pre-staged work', t => {
  const root = fixture(t);
  core.git(root, ['init', '-b', 'main']);
  core.git(root, ['config', 'user.name', 'Tooling fixture']);
  core.git(root, ['config', 'user.email', 'fixture@example.invalid']);
  core.git(root, ['add', '.']);
  core.git(root, ['commit', '-m', 'fixture setup']);
  core.write(path.join(root, 'unrelated.txt'), 'Preserve me');
  core.write(core.current(root).code, 'print("changed")\n');
  core.checkpoint(root, 'fixture revision');
  assert.equal(core.git(root, ['ls-files', 'unrelated.txt']), '');
  core.git(root, ['add', 'unrelated.txt']);
  assert.throws(() => core.checkpoint(root, 'must not happen'), /already staged/);
  assert.equal(core.git(root, ['diff', '--cached', '--name-only']), 'unrelated.txt');
});
test('real runner captures exact-version output, failures, imports, and output limits', async t => {
  const root = fixture(t), c = core.current(root);
  const sourcePython = process.env.ARENA_TEST_PYTHON || core.python(path.resolve(__dirname, '..'));
  cp.execFileSync(sourcePython, ['-m', 'venv', '--without-pip', path.join(root, '.venv')], {windowsHide:true});
  core.write(path.join(c.dir, 'helper.py'), 'value = "fixture"\n');
  core.write(c.code, 'from helper import value\nprint(value)\n');
  const good = await core.run(root);
  assert.equal(good.exitCode, 0); assert.match(good.output, /fixture/);
  assert.equal(good.sha256, core.hash(core.read(c.code)));
  const packet = core.capture(root, 'Not specified');
  assert.match(packet.packet, /exit 0/);
  core.write(c.code, 'raise ValueError("fixture error")\n');
  const bad = await core.run(root);
  assert.notEqual(bad.exitCode, 0); assert.match(bad.output, /fixture error/);
  core.write(c.code, 'print("x" * 200000)\n');
  const large = await core.run(root);
  assert.equal(large.stopped, true); assert.equal(large.output.length, 128000);
});
