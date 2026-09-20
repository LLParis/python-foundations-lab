'use strict';
const vscode = require('vscode');
const path = require('node:path');
const core = require('./core.cjs');
const platforms = require('./platforms.cjs');

function install(context, {root, saveCurrent, openExercise, output}) {
  const change = new vscode.EventEmitter();
  let syncing = false;
  const urls = {
    'Blind 75': 'https://neetcode.io/practice/practice/blind75',
    'NeetCode 150': 'https://neetcode.io/practice/practice/neetcode150',
    'LeetCode problem set': 'https://leetcode.com/problemset/',
    'Codeforces problem set': 'https://codeforces.com/problemset',
    'HackerRank preparation': 'https://www.hackerrank.com/domains/algorithms',
    'NeetCode → GitHub submissions': 'https://github.com/LLParis/neetcode-submissions'
  };
  const treeItem = (label, command, icon, detail='') => {
    const item = new vscode.TreeItem(label);
    item.command = {command:`learningArena.${command}`,title:label};
    item.iconPath = new vscode.ThemeIcon(icon); item.description = detail; return item;
  };
  const provider = {onDidChangeTreeData:change.event, getTreeItem:i=>i, getChildren:()=>[
    treeItem('External practice dashboard','externalStatus','globe'),
    treeItem('Profiles & future practice sets','externalBrowse','link-external'),
    treeItem('Start a platform exercise','externalStart','new-file'),
    treeItem('Copy my code for submission','externalCopy','copy'),
    treeItem('Record result & attempt evidence','externalRecord','checklist'),
    treeItem('Refresh LeetCode statistics','externalLeetCode','sync'),
    treeItem('Refresh Codeforces statistics','externalCodeforces','sync'),
    treeItem('Configure public profiles','externalConfigure','account')
  ]};
  context.subscriptions.push(change,vscode.window.createTreeView('learningArena.external',{treeDataProvider:provider}));
  async function show() {
    const file = platforms.render(root);
    change.fire();
    await vscode.commands.executeCommand('markdown.showPreview',vscode.Uri.file(file));
  }
  async function configure(platform) {
    platform ||= await vscode.window.showQuickPick(Object.keys(platforms.hosts), {title:'Choose a platform'});
    if (!platform) return false;
    const handle = await vscode.window.showInputBox({title:`Your ${platform} username`,
      prompt:'Public handle only. Saved in this repository for profile links; no passwords or session cookies.',
      value:platforms.profiles(root)[platform]?.handle || '',
      validateInput:s=>/^[a-zA-Z0-9_.-]{1,50}$/.test(s) ? null : 'Enter the username, not an email or URL.'});
    if (!handle) return false;
    platforms.configure(root,platform,handle); change.fire(); return true;
  }
  async function sync(platform) {
    if (syncing) return;
    if (!platforms.profiles(root)[platform]?.handle && !await configure(platform)) return;
    syncing = true;
    try {
      await vscode.window.withProgress({location:vscode.ProgressLocation.Notification,title:`Reading public ${platform} statistics`},
        ()=>platforms.sync(root,platform));
      await show();
    } finally { syncing = false; }
  }
  const actions = {
    externalStatus:show,
    externalConfigure:()=>configure(),
    externalLeetCode:()=>sync('leetcode'),
    externalCodeforces:()=>sync('codeforces'),
    externalBrowse:async()=>{
      const links = {...urls};
      for (const [name,p] of Object.entries(platforms.profiles(root))) if (p?.url) links[`${name}: ${p.handle}`] = p.url;
      const choice = await vscode.window.showQuickPick(Object.keys(links),{title:'Open a profile or future practice set'});
      if (choice) await vscode.env.openExternal(vscode.Uri.parse(links[choice]));
    },
    externalStart:async()=>{
      const url = await vscode.window.showInputBox({title:'Start an external practice attempt',
        prompt:'Use the specific problem your tutor selected. Your current lesson stays saved.',
        validateInput:s=>{try{platforms.problem(s);return null;}catch(e){return e.message;}}});
      if (!url) return;
      const collection = await vscode.window.showQuickPick([
        {label:'Other / tutor-selected',id:'other'}, {label:'Blind 75',id:'blind75'}, {label:'NeetCode 150',id:'neetcode150'}
      ],{title:'Practice collection (membership is your selection)'});
      if (!collection) return;
      const kind = await vscode.window.showQuickPick(platforms.kinds,{title:'What kind of attempt are you beginning?'});
      if (!kind) return;
      await saveCurrent(); platforms.start(root,url,collection.id,kind);
      await openExercise(); change.fire();
    },
    externalCopy:async()=>{
      const c = await saveCurrent();
      if (!platforms.source(root)) throw new Error('The current task is a custom GPT lesson. Use Copy attempt for tutor, or start a platform exercise when ready.');
      const assistance = await vscode.window.showQuickPick(platforms.helps,{title:'Help used before this platform submission'});
      if (!assistance) return;
      core.capture(root,assistance);
      await vscode.env.clipboard.writeText(core.read(c.code));
      vscode.window.showInformationMessage('Exact code copied and saved. Paste into the platform editor, check its required interface, and submit yourself.');
    },
    externalRecord:async()=>{
      await saveCurrent();
      if (!platforms.source(root)) throw new Error('The current foundations lesson has no external problem attached.');
      const outcome = await vscode.window.showQuickPick(platforms.outcomes,{title:'What result did the platform show?'});
      if (!outcome) return;
      let evidenceUrl;
      if (outcome !== 'Not submitted') {
        evidenceUrl = await vscode.window.showInputBox({title:'Platform submission / result URL',
          prompt:'This link is recorded as learner-reported evidence, not automatically verified.',
          validateInput:s=>{try{platforms.platformUrl(s);return null;}catch(e){return e.message;}}});
        if (!evidenceUrl) return;
      }
      const assistance = await vscode.window.showQuickPick(platforms.helps,{title:'Help used on this attempt'});
      if (!assistance) return;
      platforms.record(root,{outcome,evidenceUrl,assistance}); await show();
      vscode.window.showInformationMessage('Result and code capture saved locally. Acceptance, help, and attempt type remain separate.');
    }
  };
  for (const [name,action] of Object.entries(actions)) context.subscriptions.push(vscode.commands.registerCommand(`learningArena.${name}`,async()=>{
    if (!vscode.workspace.isTrusted) return;
    try { await action(); } catch(error) { output.appendLine(error.stack||error.message); vscode.window.showErrorMessage(error.message); }
  }));
}
module.exports = {install};
