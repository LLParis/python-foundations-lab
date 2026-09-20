'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const p = require('./vscode-extension/platforms.cjs');
const c = require('./vscode-extension/core.cjs');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(),'arena-platform-check-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  c.newExercise(root,'original lesson','Original task');
  c.write(c.current(root).code,'# learner draft\n');
  return root;
}
function leetData() { return {data:{matchedUser:{username:'fixture',submitStatsGlobal:{acSubmissionNum:[
  {difficulty:'All',count:3,submissions:32},{difficulty:'Easy',count:3,submissions:32},
  {difficulty:'Medium',count:0,submissions:0},{difficulty:'Hard',count:0,submissions:0}
]}},recentAcSubmissionList:[]}}; }
test('problem identity is canonical, trackers are dropped, and other hosts are rejected',()=>{
  assert.equal(p.problem('https://codeforces.com/contest/4/problem/A').key,p.problem('https://codeforces.com/problemset/problem/4/A').key);
  assert.equal(p.problem('https://leetcode.com/problems/two-sum/description/?envId=x').url,'https://leetcode.com/problems/two-sum/description/');
  assert.throws(()=>p.problem('https://leetcode.com.attacker.invalid/problems/a'));
  assert.throws(()=>p.problem('https://user:password@leetcode.com/problems/a'));
  assert.throws(()=>p.problem('https://www.hackerrank.com/test/private'));
});
test('starting and recording external work preserves the old lesson and exact code',t=>{
  const root=fixture(t), old=c.current(root), original=c.read(old.code);
  const next=p.start(root,'https://leetcode.com/problems/two-sum/','blind75','Delayed re-solve');
  assert.equal(c.read(old.code),original);
  c.write(next.code,'# later learner attempt\n');
  const row=p.record(root,{outcome:'Not submitted',assistance:'Hint or explanation used'});
  assert.equal(row.attemptKind,'Delayed re-solve');
  assert.equal(row.mastery,'not assessed by tooling');
  assert.match(row.evidenceType,/learner-reported/);
  assert.equal(c.read(path.join(root,row.capture,'attempt.py')),'# later learner attempt\n');
  const packet=c.capture(root,'Not specified').packet;
  assert.match(packet,/https:\/\/leetcode.com\/problems\/two-sum/);
  assert.match(packet,/Delayed re-solve/);
  assert.throws(()=>p.record(root,{outcome:'Accepted',assistance:'Not specified',evidenceUrl:'https://codeforces.com/contest/4/submission/5'}));
});
test('LeetCode counts unique solves rather than repeated accepted submissions',()=>{
  const parsed=p.parseLeetCode(leetData(),'fixture');
  assert.equal(parsed.solved.All,3);
  assert.deepEqual(parsed.recentAccepted,[]);
  assert.equal(parsed.independentAbility,'not assessed');
  assert.throws(()=>p.parseLeetCode({data:{matchedUser:null}},'fixture'));
  const broken=leetData(); broken.data.matchedUser.submitStatsGlobal.acSubmissionNum.pop();
  assert.throws(()=>p.parseLeetCode(broken,'fixture'));
});
test('Codeforces deduplicates problem identities and preserves unrated state',()=>{
  const info=[{handle:'fixture'}];
  const accepted={verdict:'OK',contestId:4,problem:{contestId:4,index:'A'}};
  const parsed=p.parseCodeforces(info,[accepted,accepted,{verdict:'WRONG_ANSWER',contestId:4,problem:{contestId:4,index:'B'}}],'fixture');
  assert.equal(parsed.uniqueAcceptedInFetchedHistory,1);
  assert.equal(parsed.acceptedSubmissions,2);
  assert.equal(parsed.rating,null);
  assert.throws(()=>p.parseCodeforces(info,[{verdict:'OK'}],'fixture'));
});
test('failed refresh retains the last good snapshot and visibly reports failure',async t=>{
  const root=fixture(t); p.configure(root,'leetcode','fixture');
  await p.sync(root,'leetcode',async()=>leetData());
  const file=path.join(root,'platforms/snapshots/leetcode.json'), before=c.read(file);
  await assert.rejects(()=>p.sync(root,'leetcode',async()=>{throw new Error('fixture outage');}));
  assert.equal(c.read(file),before);
  assert.match(c.read(path.join(root,'platforms/README.md')),/Last refresh failed/);
  assert.match(c.read(path.join(root,'platforms/README.md')),/3 solved/);
  p.configure(root,'leetcode','different');
  assert.doesNotMatch(c.read(path.join(root,'platforms/README.md')),/3 solved/);
});
