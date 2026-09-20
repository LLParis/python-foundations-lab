'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('./core.cjs');
const directory = root => path.join(root, '.arena', 'browser');
function read(root, name) {
  try { return core.json(path.join(directory(root), name + '.json')); } catch { return null; }
}
function write(root, name, data) {
  const file = path.join(directory(root), name + '.json');
  fs.mkdirSync(directory(root), {recursive:true});
  const temp = file + '.' + crypto.randomUUID() + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(data,null,2) + '\n');
  fs.renameSync(temp,file);
}
function reviewMessage(review) {
  return `Review my latest submitted attempt and continue our lesson. Use GitHub to read LLParis/python-foundations-lab on main: tutor/PROTOCOL.md and tutor/latest-attempt.json. Expected attemptId: ${review.id}. Publication commit: ${review.commit}. Update tutor/active.json with our current next step, following the handoff protocol, so my VS Code preview stays in sync.`;
}
function connected(root) {
  return Date.now() - (read(root,'health')?.at || 0) < 12000;
}
function queue(root, review) {
  if (!review?.published || !/^[a-f0-9]{40}$/.test(review.commit || '')) throw new Error('Publish the attempt before requesting tutor review.');
  if (!/^[a-zA-Z0-9-]{1,120}$/.test(review.id || '')) throw new Error('Invalid attempt ID.');
  const url = new URL(core.local(root).tutorUrl);
  if (url.origin !== 'https://chatgpt.com' || !/^\/c\/[a-f0-9-]+\/?$/.test(url.pathname)) throw new Error('Configure the existing ChatGPT tutor conversation first.');
  const prior = read(root,'request');
  const receipt = read(root,'receipt');
  if (receipt?.attemptId === review.id && ['sent','uncertain','sending'].includes(receipt.status)) return receipt;
  if (prior?.attemptId === review.id && prior.expiresAt > Date.now() && receipt?.requestId !== prior.requestId) return {status:'queued'};
  if (!connected(root)) return {status:'disconnected'};
  const request = {schema:1, requestId:crypto.randomUUID(), attemptId:review.id, commit:review.commit,
    url:url.origin+url.pathname.replace(/\/$/,''), text:reviewMessage(review), expiresAt:Date.now()+300000};
  write(root,'request',request);
  return {status:'queued'};
}
function status(root, attemptId) {
  if (!attemptId) return null;
  const request = read(root,'request'), receipt = read(root,'receipt');
  if (receipt && receipt.attemptId === attemptId) return receipt.status;
  if (request && request.attemptId === attemptId) return request.expiresAt > Date.now() ? 'queued' : 'expired';
  return null;
}
module.exports = {queue, status, connected, reviewMessage};
