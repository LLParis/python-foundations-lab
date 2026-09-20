'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');

const read = p => fs.readFileSync(p, 'utf8');
const json = p => JSON.parse(read(p));
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');
function write(p, text) {
  fs.mkdirSync(path.dirname(p), {recursive: true});
  fs.writeFileSync(p, text, 'utf8');
}
function writeJson(p, value) { write(p, JSON.stringify(value, null, 2) + '\n'); }
function inside(root, relative) {
  const file = path.resolve(root, relative);
  const rel = path.relative(path.resolve(root), file);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
    throw new Error('Path must stay inside this arena.');
  }
  // Reject symlink/junction escapes, including existing parent directories.
  let ancestor = file;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const realRel = path.relative(fs.realpathSync.native(root), fs.realpathSync.native(ancestor));
  if (realRel === '..' || realRel.startsWith('..' + path.sep) || path.isAbsolute(realRel)) {
    throw new Error('Linked path leaves the arena.');
  }
  return file;
}
function current(root) {
  const state = json(path.join(root, 'CURRENT.json'));
  if (!/^\d{4,}-[a-z0-9-]+$/.test(state.exercise)) throw new Error('Invalid exercise id.');
  const dir = inside(root, path.join('exercises', state.exercise));
  return {...state, dir, code: path.join(dir, 'attempt.py'),
    prompt: path.join(dir, 'prompt.md'), notes: path.join(dir, 'notes.md')};
}
function local(root) {
  const p = path.join(root, '.arena', 'local.json');
  return fs.existsSync(p) ? json(p) : {};
}
function python(root) {
  return path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
}
function fence(value, language = '') {
  const runs = value.match(/`+/g) || [];
  const ticks = '`'.repeat(Math.max(3, ...runs.map(r => r.length + 1)));
  return `${ticks}${language}\n${value}\n${ticks}`;
}
function capture(root, assistance) {
  const allowed = ['No help on this attempt', 'Hint or explanation used', 'Solution code viewed or used', 'Not specified'];
  if (!allowed.includes(assistance)) throw new Error('Choose an assistance label.');
  const c = current(root), code = read(c.code), notes = read(c.notes), prompt = read(c.prompt);
  const id = stamp() + '-' + crypto.randomBytes(3).toString('hex');
  const directory = inside(root, path.join('exercises', c.exercise, 'captures', id));
  fs.mkdirSync(directory, {recursive: true});
  const metadata = {
    capturedAt: new Date().toISOString(), exercise: c.exercise,
    assistance, assessment: 'ungraded', source: 'learner-requested capture',
    sha256: hash(code), promptSha256: hash(prompt)
  };
  write(path.join(directory, 'attempt.py'), code);
  write(path.join(directory, 'notes.md'), notes);
  write(path.join(directory, 'prompt.md'), prompt);
  writeJson(path.join(directory, 'capture.json'), metadata);
  const runPath = path.join(root, '.arena', 'runs', `${c.exercise}.json`);
  let runText = 'Not run by the arena runner for this version. This may be a prediction-only attempt.';
  if (fs.existsSync(runPath)) {
    const run = json(runPath);
    if (run.sha256 === metadata.sha256 && run.exercise === c.exercise) {
      runText = `Run at ${run.ranAt}; exit ${run.exitCode}; ${run.stopped ? 'stopped at limit' : 'finished'}.\n`
        + fence(run.output, 'text') + '\nExecution is not a correctness or mastery assessment.';
    } else runText = 'Earlier output exists but belongs to different code; it is intentionally omitted.';
  }
  const packet = `# My current learning attempt\n\nExercise: ${c.exercise}\nCapture: ${id}\n`
    + `Help used (self-report): ${assistance}\nAssessment: ungraded\n\n`
    + `Please review this attempt in our existing lesson. Give the smallest useful hint if needed; `
    + `do not replace my attempt with a full solution or advance the lesson automatically.\n\n`
    + `## Task\n\n${prompt}\n\n## My code\n\n${fence(code, 'python')}\n\n`
    + `## My reasoning / prediction\n\n${notes}\n\n## Execution record\n\n${runText}\n`;
  const packetPath = path.join(root, '.arena', 'packets', `${id}.md`);
  write(packetPath, packet);
  return {packet, packetPath, directory, metadata};
}
function newExercise(root, title, prompt) {
  if (!title.trim() || !prompt.trim()) throw new Error('A title and copied prompt are required.');
  if (prompt.length > 100000) throw new Error('Copy only the exercise block, not the entire conversation.');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  if (!slug) throw new Error('Use at least one letter or number in the title.');
  const base = path.join(root, 'exercises');
  fs.mkdirSync(base, {recursive: true});
  const ids = fs.readdirSync(base).map(n => Number(n.match(/^(\d+)-/)?.[1] || 0));
  const id = String(Math.max(0, ...ids) + 1).padStart(4, '0') + '-' + slug;
  const dir = inside(root, path.join('exercises', id));
  fs.mkdirSync(dir); // never overwrite an existing exercise
  write(path.join(dir, 'prompt.md'), `# ${title.trim()}\n\n${prompt}\n`);
  write(path.join(dir, 'attempt.py'), '# Write your own attempt here.\n');
  write(path.join(dir, 'notes.md'), '# My reasoning\n\n## Prediction before running\n\n\n## Approach\n\n\n## Help and repairs\n\n\n## Next revisit\n\n');
  writeJson(path.join(root, 'CURRENT.json'), {exercise: id, status: 'in-progress', source: 'Tutor prompt copied by learner'});
  return current(root);
}
function selectExercise(root, id) {
  if (!/^\d{4,}-[a-z0-9-]+$/.test(id)) throw new Error('Invalid exercise id.');
  const dir = inside(root, path.join('exercises', id));
  if (!fs.existsSync(path.join(dir, 'attempt.py'))) throw new Error('Exercise not found.');
  writeJson(path.join(root, 'CURRENT.json'), {exercise: id, status: 'in-progress', source: 'Selected existing exercise'});
}
function git(root, args) {
  const result = cp.spawnSync('git', args, {cwd: root, encoding: 'utf8', windowsHide: true});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Git command failed.');
  return result.stdout.trim();
}
function checkpoint(root, message) {
  const top = fs.realpathSync.native(git(root, ['rev-parse', '--show-toplevel']));
  if (top.toLowerCase() !== fs.realpathSync.native(root).toLowerCase()) throw new Error('Wrong Git repository.');
  if (git(root, ['diff', '--cached', '--name-only'])) {
    throw new Error('There are already staged changes. Review and commit them in Source Control first.');
  }
  const c = current(root);
  git(root, ['add', '--', `exercises/${c.exercise}`, 'CURRENT.json', 'PROGRESS.md']);
  if (!git(root, ['diff', '--cached', '--name-only'])) return 'No new exercise changes to save.';
  git(root, ['commit', '-m', `practice(${c.exercise}): ${message}`]);
  return `Saved locally: ${git(root, ['rev-parse', '--short', 'HEAD'])}. Nothing uploaded.`;
}
function run(root, onOutput = () => {}) {
  const c = current(root), code = read(c.code), executable = python(root);
  if (!fs.existsSync(executable)) throw new Error('Python environment is missing. Run tools/install.ps1.');
  const started = new Date().toISOString();
  const runId = stamp() + '-' + crypto.randomBytes(3).toString('hex');
  const runDir = path.join(root, '.arena', 'executions', runId);
  const runFile = path.join(runDir, 'attempt.py');
  write(runFile, code); // execute exactly the captured bytes
  return new Promise((resolve, reject) => {
    let output = '', stopped = false, completed = false;
    const child = cp.spawn(executable, ['-u', runFile], {
      cwd: c.dir, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
      env: {...process.env, PYTHONIOENCODING: 'utf-8',
        PYTHONPATH: c.dir + (process.env.PYTHONPATH ? path.delimiter + process.env.PYTHONPATH : '')}
    });
    const stop = () => { stopped = true; child.kill(); };
    const timer = setTimeout(stop, 30000);
    const append = chunk => {
      const text = chunk.toString('utf8');
      const remaining = 128000 - output.length;
      if (remaining > 0) { const part = text.slice(0, remaining); output += part; onOutput(part); }
      if (text.length > remaining) stop();
    };
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', append); child.stderr.on('data', append);
    child.on('error', error => { clearTimeout(timer); if (!completed) { completed = true; reject(error); } });
    child.on('close', (exitCode, signal) => {
      clearTimeout(timer); if (completed) return; completed = true;
      const result = {exercise: c.exercise, ranAt: started, sha256: hash(code), exitCode, signal, stopped, output};
      writeJson(path.join(root, '.arena', 'runs', `${c.exercise}.json`), result);
      writeJson(path.join(runDir, 'run.json'), result);
      resolve(result);
    });
  });
}
module.exports = {read, json, write, writeJson, inside, current, local, python, hash, stamp,
  fence, capture, newExercise, selectExercise, checkpoint, git, run};
