'use strict';
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const core = require('./core.cjs');
const repository = 'LLParis/python-foundations-lab';
const stateFile = root => path.join(root, '.arena', 'daily.json');
const state = root => fs.existsSync(stateFile(root)) ? core.json(stateFile(root)) : {};
function saveState(root, changes) {
  const next = {...state(root), ...changes}; core.writeJson(stateFile(root), next); return next;
}
function command(root, program, args, input) {
  return new Promise((resolve, reject) => {
    const child = cp.execFile(program, args, {cwd:root,windowsHide:true,encoding:'utf8',timeout:45000,maxBuffer:2000000,
      env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'Never'}}, (error,stdout,stderr)=>{
      if (error) reject(new Error((stderr || stdout || error.message).trim()));
      else resolve(stdout.trim());
    });
    if (input !== undefined) child.stdin.end(input); else child.stdin.end();
  });
}
const git = (root, args) => command(root, 'git', args);
function validateLesson(data) {
  if (!data || data.schema !== 1 || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(data.lessonId || '')
      || !Number.isSafeInteger(data.revision) || data.revision < 1
      || typeof data.title !== 'string' || !data.title.trim() || data.title.length > 160
      || typeof data.prompt !== 'string' || !data.prompt.trim() || data.prompt.length > 100000
      || typeof data.allowRun !== 'boolean') throw new Error('The tutor lesson file is incomplete. Your current work is preserved.');
  if (data.respondingTo !== null && (typeof data.respondingTo !== 'string' || data.respondingTo.length > 120)) {
    throw new Error('Invalid tutor response reference.');
  }
  return {schema:1,lessonId:data.lessonId,revision:data.revision,title:data.title,prompt:data.prompt,
    allowRun:data.allowRun,respondingTo:data.respondingTo,connection:data.connection === 'confirmed' ? 'confirmed' : 'pending'};
}
function fingerprint(root, assistance = 'Not specified') {
  const c = core.current(root);
  return core.hash(JSON.stringify([c.exercise,c.remoteLessonId || c.exercise,core.read(c.code),core.read(c.notes),core.read(c.prompt),assistance]));
}
function backup(root) {
  const c = core.current(root), code = core.read(c.code), notes = core.read(c.notes);
  const directory = path.join(root,'.arena','drafts',c.exercise);
  core.write(path.join(directory,'attempt.py'),code);
  core.write(path.join(directory,'notes.md'),notes);
  core.writeJson(path.join(directory,'saved.json'),{at:new Date().toISOString(),codeSha256:core.hash(code)});
}
function applyLesson(root, data, force = false) {
  const lesson = validateLesson(data), s = state(root), c = core.current(root);
  const lessonKey = lesson.lessonId + ':' + lesson.revision;
  const digest = core.hash(JSON.stringify(lesson));
  if (s.appliedKey === lessonKey && s.appliedDigest === digest) return {changed:false};
  const remoteId = c.remoteLessonId || c.exercise;
  if (lesson.lessonId === remoteId && s.appliedLessonId === lesson.lessonId && lesson.revision < (s.appliedRevision || 0)) {
    return {changed:false};
  }
  const isNew = lesson.lessonId !== remoteId;
  const stillSubmittedVersion = s.lastReview?.codeSha256 === core.hash(core.read(c.code))
    && s.lastReview?.notesSha256 === core.hash(core.read(c.notes))
    && s.lastReview?.exercise === c.exercise;
  if (isNew && !force && !(lesson.respondingTo && lesson.respondingTo === s.lastReview?.id && stillSubmittedVersion && s.lastReview?.published)) {
    saveState(root,{pendingLesson:lesson}); return {changed:false,pending:true};
  }
  backup(root);
  let next = c;
  if (isNew) next = core.newExercise(root,lesson.title,lesson.prompt);
  else if (core.read(c.prompt) !== lesson.prompt) core.write(c.prompt,lesson.prompt);
  const current = core.json(path.join(root,'CURRENT.json'));
  core.writeJson(path.join(root,'CURRENT.json'),{...current,remoteLessonId:lesson.lessonId,tutorRevision:lesson.revision,allowRun:lesson.allowRun});
  core.writeJson(path.join(root,'.arena','tutor-inbox',lessonKey.replace(':','-')+'.json'),lesson);
  saveState(root,{appliedKey:lessonKey,appliedDigest:digest,appliedLessonId:lesson.lessonId,appliedRevision:lesson.revision,
    pendingLesson:null,tutorConfirmed:lesson.connection === 'confirmed',lastReceivedAt:new Date().toISOString(),
    ...(isNew ? {assistance:'Not specified'} : {})});
  return {changed:true,newExercise:isNew,exercise:next.exercise};
}
async function fetchLesson(root) {
  const raw = await command(root,'gh',['api',`repos/${repository}/contents/tutor/active.json?ref=main`]);
  const data = JSON.parse(raw);
  if (data.type !== 'file' || data.encoding !== 'base64' || data.size > 150000) throw new Error('Unexpected tutor lesson response.');
  return validateLesson(JSON.parse(Buffer.from(data.content,'base64').toString('utf8')));
}
async function assertHome(root, run = git) {
  const top = await run(root,['rev-parse','--show-toplevel']);
  if (fs.realpathSync.native(top).toLowerCase() !== fs.realpathSync.native(root).toLowerCase()) throw new Error('Daily mode is outside its repository.');
  if (await run(root,['branch','--show-current']) !== 'main') throw new Error('Daily publishing is paused on a maintenance branch.');
  const remote = (await run(root,['remote','get-url','origin'])).toLowerCase().replace(/\.git$/,'');
  if (!['https://github.com/llparis/python-foundations-lab','git@github.com:llparis/python-foundations-lab'].includes(remote)) {
    throw new Error('The publishing destination is not the configured learning repository.');
  }
  if (await run(root,['diff','--cached','--name-only'])) throw new Error('Other changes are already staged. Your draft is saved; those changes need review before automatic publishing.');
}
function prepareReview(root) {
  const s = state(root), assistance = s.assistance || 'Not specified', key = fingerprint(root,assistance);
  if (s.lastReview?.fingerprint === key) return s.lastReview;
  const captured = core.capture(root,assistance), c = core.current(root);
  const id = path.basename(captured.directory);
  const code = core.read(path.join(captured.directory,'attempt.py'));
  const reasoning = core.read(path.join(captured.directory,'notes.md'));
  const prompt = core.read(path.join(captured.directory,'prompt.md'));
  const payload = {schema:1,status:'ready-for-review',attemptId:id,lessonId:c.remoteLessonId || c.exercise,
    exercise:c.exercise,capturedAt:captured.metadata.capturedAt,assistance,
    codeSha256:core.hash(code),code,reasoning,prompt,assessment:'not assessed by tooling',
    ...(captured.metadata.platformSource ? {platformSource:captured.metadata.platformSource} : {})};
  const outbox = path.join(root,'.arena','outbox',id);
  core.writeJson(path.join(outbox,'latest-attempt.json'),payload);
  core.writeJson(path.join(outbox,'CURRENT.json'),core.json(path.join(root,'CURRENT.json')));
  const markdown = `# Latest learner attempt\n\nExercise: **${c.exercise}** · ${payload.capturedAt}\n\nHelp reported: ${assistance}\n\nStatus: ready for tutor review; no mastery claim.\n\n## Task\n\n${prompt}\n\n## Code at review cutoff\n\n${core.fence(code,'python')}\n\n## Reasoning\n\n${reasoning}\n`;
  core.write(path.join(outbox,'LATEST.md'),markdown);
  const platformFiles=[];
  for(const relative of ['platforms/README.md','platforms/profiles.json','platforms/snapshots/leetcode.json','platforms/snapshots/codeforces.json']) {
    const file=path.join(root,relative);
    if(fs.existsSync(file)) {core.write(path.join(outbox,relative),core.read(file));platformFiles.push(relative);}
  }
  const review = {id,exercise:c.exercise,fingerprint:key,capture:captured.directory,outbox,
    codeSha256:payload.codeSha256,notesSha256:core.hash(reasoning),platformFiles,published:false};
  saveState(root,{lastReview:review}); return review;
}
async function stageFile(root, run, source, target) {
  // Stage the frozen snapshot, not a possibly newer editor buffer.
  const sha = await run(root,['hash-object','-w',source]);
  await run(root,['update-index','--add','--cacheinfo',`100644,${sha},${target}`]);
}
async function publishReview(root, review, run = git) {
  await assertHome(root,run);
  await run(root,['fetch','origin','main']);
  const ahead = await run(root,['rev-list','--count','origin/main..HEAD']);
  if (Number(ahead)) {
    const pendingPaths = (await run(root,['diff','--name-only','origin/main...HEAD'])).split('\n').filter(Boolean);
    if (pendingPaths.some(p => !/^(exercises\/|tutor\/|platforms\/|CURRENT\.json$|PROGRESS\.md$)/.test(p))) {
      throw new Error('There are unpublished maintenance changes. Your attempt is saved locally; automatic publishing has paused.');
    }
    // Never force a branch update. Non-overlapping tutor changes merge normally.
    await run(root,['merge','--no-edit','origin/main']);
  } else await run(root,['merge','--ff-only','origin/main']);
  if (!review.committed) {
    const files = [
      [path.join(review.outbox,'latest-attempt.json'),'tutor/latest-attempt.json'],
      [path.join(review.outbox,'LATEST.md'),'tutor/LATEST.md'],
      [path.join(review.outbox,'CURRENT.json'),'CURRENT.json'],
      [path.join(review.capture,'attempt.py'),`exercises/${review.exercise}/attempt.py`],
      [path.join(review.capture,'notes.md'),`exercises/${review.exercise}/notes.md`],
      [path.join(review.capture,'prompt.md'),`exercises/${review.exercise}/prompt.md`]
    ];
    for (const name of ['attempt.py','notes.md','prompt.md','capture.json']) {
      files.push([path.join(review.capture,name),path.relative(root,path.join(review.capture,name)).replaceAll(path.sep,'/')]);
    }
    for(const relative of review.platformFiles || []) files.push([path.join(review.outbox,relative),relative]);
    for (const [source,target] of files) await stageFile(root,run,source,target);
    await run(root,['commit','-m',`practice(${review.exercise}): submit learner attempt for tutor review`]);
    // Write tracked transport files locally only after committing their exact blobs.
    for (const name of ['latest-attempt.json','LATEST.md']) core.write(path.join(root,'tutor',name),core.read(path.join(review.outbox,name)));
    review = {...review,committed:true,commit:await run(root,['rev-parse','HEAD'])};
    saveState(root,{lastReview:review});
  }
  await run(root,['push','origin','HEAD:main']);
  review = {...review,published:true,publishedAt:new Date().toISOString()};
  saveState(root,{lastReview:review,publishError:null}); return review;
}
module.exports = {repository,state,saveState,command,git,validateLesson,fingerprint,backup,applyLesson,fetchLesson,assertHome,prepareReview,publishReview,stageFile};
