#!/usr/bin/env node
'use strict';
const path = require('node:path');
const p = require('./vscode-extension/platforms.cjs');
const root = path.resolve(__dirname,'..');
(async()=>{
  const [command,platform,handle] = process.argv.slice(2);
  if (command === 'sync') console.log(JSON.stringify(await p.sync(root,platform),null,2));
  else if (command === 'configure') { p.configure(root,platform,handle); console.log('Public profile saved.'); }
  else if (command === 'status' || !command) console.log(p.render(root));
  else throw new Error('Usage: platforms-cli.cjs [status|sync leetcode|sync codeforces|configure PLATFORM HANDLE]');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
