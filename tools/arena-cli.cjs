#!/usr/bin/env node
'use strict';
// Maintenance interface; day-to-day practice uses the VS Code sidebar.
const path = require('node:path');
const core = require('./vscode-extension/core.cjs');
const root = path.resolve(__dirname, '..');
(async () => {
  switch (process.argv[2] || 'status') {
    case 'status': console.log(JSON.stringify({exercise: core.current(root).exercise, python: core.python(root), status: 'ungraded'}, null, 2)); break;
    case 'run': { const r = await core.run(root, text => process.stdout.write(text)); process.exitCode = r.exitCode || (r.stopped ? 1 : 0); break; }
    default: throw new Error('Usage: arena-cli.cjs [status|run]');
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
