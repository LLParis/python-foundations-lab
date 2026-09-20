'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const c=require('./vscode-extension/core.cjs');
const d=require('./vscode-extension/daily-core.cjs');
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'arena-daily-check-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  c.newExercise(root,'original','Original prompt');
  c.write(c.current(root).code,'# original learner draft\n');
  return root;
}
function lesson(id,revision=1,respondingTo=null) {return {schema:1,lessonId:id,revision,title:'Next exercise',prompt:'A task without a solution.',allowRun:false,respondingTo,connection:'confirmed'};}
test('same-lesson delivery changes the prompt without replacing learner code',t=>{
  const root=fixture(t),current=c.current(root),before=c.read(current.code);
  const result=d.applyLesson(root,lesson(current.exercise));
  assert.equal(result.changed,true);
  assert.equal(c.read(current.code),before);
  assert.equal(d.state(root).tutorConfirmed,true);
  assert.equal(d.applyLesson(root,lesson(current.exercise)).changed,false);
  assert.throws(()=>d.validateLesson(lesson('../escape')));
});
test('new lesson waits for newer edits and only advances the matching submitted version',t=>{
  const root=fixture(t),current=c.current(root);
  d.saveState(root,{lastReview:{id:'review-1',exercise:current.exercise,published:true,codeSha256:c.hash(c.read(current.code)),notesSha256:c.hash(c.read(current.notes))}});
  c.write(current.code,'# newer work\n');
  assert.equal(d.applyLesson(root,lesson('new-lesson',1,'review-1')).pending,true);
  assert.equal(c.current(root).exercise,current.exercise);
  c.write(current.code,'# original learner draft\n');
  assert.equal(d.applyLesson(root,lesson('new-lesson',1,'review-1')).newExercise,true);
  assert.equal(c.read(current.code),'# original learner draft\n');
  assert.notEqual(c.current(root).exercise,current.exercise);
});
test('repeated review preparation reuses the same snapshot without manufacturing activity',t=>{
  const root=fixture(t),a=d.prepareReview(root),b=d.prepareReview(root);
  assert.equal(a.id,b.id);
  assert.equal(c.json(path.join(a.outbox,'latest-attempt.json')).status,'ready-for-review');
  c.write(c.current(root).code,'# new actual work\n');
  assert.notEqual(d.prepareReview(root).id,a.id);
});
test('Git publication uses the frozen version, preserves newer edits, and retries without a second commit',async t=>{
  const root=fixture(t),remote=fs.mkdtempSync(path.join(os.tmpdir(),'arena-remote-check-'));
  t.after(()=>fs.rmSync(remote,{recursive:true,force:true}));
  c.write(path.join(root,'.gitignore'),'.arena/\n');
  c.write(path.join(root,'README.md.backup'),'original backup\n');
  c.git(root,['init','-b','main']);c.git(root,['config','user.name','Tool fixture']);c.git(root,['config','user.email','fixture@example.invalid']);
  c.git(root,['add','.']);c.git(root,['commit','-m','fixture setup']);
  c.git(root,['init','--bare',remote]);c.git(root,['remote','add','origin',remote]);c.git(root,['push','-u','origin','main']);
  c.write(c.current(root).code,'# review cutoff\n');
  const review=d.prepareReview(root);
  c.write(c.current(root).code,'# newer unsent work\n');
  c.write(path.join(root,'README.md.backup'),'unrelated pre-existing change\n');
  let failPush=true;
  const run=async(r,args)=>{
    if(args.join(' ')==='remote get-url origin')return 'https://github.com/LLParis/python-foundations-lab.git';
    if(args[0]==='push'&&failPush)throw new Error('fixture network outage');
    return d.git(r,args);
  };
  await assert.rejects(()=>d.publishReview(root,review,run),/fixture network outage/);
  const firstCommit=c.git(root,['rev-parse','HEAD']);
  failPush=false;
  const published=await d.publishReview(root,d.state(root).lastReview,run);
  assert.equal(published.published,true);
  assert.equal(c.git(root,['rev-parse','HEAD']),firstCommit);
  assert.equal(c.git(root,['show',`origin/main:exercises/${review.exercise}/attempt.py`]),'# review cutoff');
  assert.equal(c.read(c.current(root).code),'# newer unsent work\n');
  assert.equal(c.read(path.join(root,'README.md.backup')),'unrelated pre-existing change\n');
  assert.equal(c.git(root,['show','origin/main:README.md.backup']),'original backup');
  assert.equal(c.git(root,['ls-tree','--name-only','origin/main','.arena']),'');
});
