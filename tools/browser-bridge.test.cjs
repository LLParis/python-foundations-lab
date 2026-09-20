'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const bridge=require('./vscode-extension/browser-bridge.cjs');

function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'arena-bridge-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const data=path.join(root,'.arena','browser');fs.mkdirSync(data,{recursive:true});
  fs.writeFileSync(path.join(root,'.arena','local.json'),JSON.stringify({tutorUrl:'https://chatgpt.com/c/1234-abcd'}));
  const write=(name,value)=>fs.writeFileSync(path.join(data,name+'.json'),JSON.stringify(value));
  return {root,data,write,review:{id:'attempt-1',published:true,commit:'a'.repeat(40)}};
}
test('no review is queued before publication or while disconnected',t=>{
  const {root,data,review}=fixture(t);
  assert.equal(bridge.status(root,undefined),null);
  assert.throws(()=>bridge.queue(root,{...review,published:false}),/Publish/);
  assert.equal(bridge.queue(root,review).status,'disconnected');
  assert.equal(fs.existsSync(path.join(data,'request.json')),false);
});
test('a connected Ready names the exact attempt and reuses a pending request',t=>{
  const {root,data,review,write}=fixture(t);write('health',{at:Date.now()});
  assert.equal(bridge.queue(root,review).status,'queued');
  const request=JSON.parse(fs.readFileSync(path.join(data,'request.json')));
  assert.match(request.text,/Expected attemptId: attempt-1/);
  assert.match(request.text,/tutor\/active.json/);
  assert.equal(request.url,'https://chatgpt.com/c/1234-abcd');
  bridge.queue(root,review);
  assert.equal(JSON.parse(fs.readFileSync(path.join(data,'request.json'))).requestId,request.requestId);
});
test('confirmed and uncertain sends are not automatically duplicated',t=>{
  const {root,review,write}=fixture(t);write('health',{at:Date.now()});
  for(const status of ['sent','sending','uncertain']) {
    write('receipt',{attemptId:review.id,status});
    assert.equal(bridge.queue(root,review).status,status);
  }
});
test('a safely blocked request can be retried after the user resolves it',t=>{
  const {root,data,review,write}=fixture(t);write('health',{at:Date.now()});bridge.queue(root,review);
  const request=JSON.parse(fs.readFileSync(path.join(data,'request.json')));
  write('receipt',{attemptId:review.id,requestId:request.requestId,status:'blocked'});
  assert.equal(bridge.queue(root,review).status,'queued');
  assert.notEqual(JSON.parse(fs.readFileSync(path.join(data,'request.json'))).requestId,request.requestId);
});
