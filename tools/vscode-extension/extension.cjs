'use strict';
const vscode = require('vscode');
const fs = require('node:fs');
const path = require('node:path');
const core = require('./core.cjs');

async function activate(context) {
  const folder = vscode.workspace.workspaceFolders?.find(f => fs.existsSync(path.join(f.uri.fsPath, 'arena.json')));
  if (!folder) return;
  const root = folder.uri.fsPath;
  const output = vscode.window.createOutputChannel('Learning Arena');
  const changed = new vscode.EventEmitter();
  let busy = false;
  let dailyMode;
  const runtimePath = path.join(root, '.arena', 'runtime.json');
  function mark(action) {
    core.writeJson(runtimePath, {activated: true, version: context.extension.packageJSON.version,
      lastAction: action, at: new Date().toISOString(), exercise: core.current(root).exercise,
      python: core.python(root), modelCalls: 0});
    changed.fire();
  }
  function item(label, command, icon, description = '') {
    const i = new vscode.TreeItem(label);
    if (command) i.command = {command: `learningArena.${command}`, title: label};
    i.iconPath = new vscode.ThemeIcon(icon); i.description = description; return i;
  }
  const provider = {
    onDidChangeTreeData: changed.event,
    getTreeItem: i => i,
    getChildren: node => node?.children || [
      item(core.current(root).exercise, 'open', 'book', 'current exercise'),
      item('Resume learning', 'resume', 'play-circle'),
      item('Ready for review', 'ready', 'send', 'save + publish for GPT web'),
      item('Run when ready', 'run', 'play'),
      item('Finish session', 'finish', 'save'),
      item(dailyMode?.getStatus() || 'Drafts save automatically', 'resume', 'info'),
      Object.assign(new vscode.TreeItem('More tools',vscode.TreeItemCollapsibleState.Collapsed),{children:[
      item('Prediction / reasoning notes', 'notes', 'note'),
      item('Set help used (optional)', 'assistance', 'account'),
      item('Open a waiting next exercise', 'nextLesson', 'arrow-right'),
      item('Copy attempt for tutor', 'copy', 'copy'),
      item('Open GPT web tutor', 'tutor', 'link-external'),
      item('Debug current attempt', 'debug', 'debug-alt'),
      item('Save tutor feedback from clipboard', 'feedback', 'comment-discussion'),
      item('Save local checkpoint', 'checkpoint', 'git-commit'),
      item('New exercise from clipboard', 'new', 'new-file'),
      item('Revisit an exercise', 'select', 'history'),
      item('Progress and next steps', 'progress', 'checklist'),
      item('GitHub setup', 'github', 'github'),
      item('Copy one-time tutor handoff', 'handoff', 'arrow-swap'),
      item('No model calls · publishing happens on Ready', null, 'info')
      ]})
    ]
  };
  context.subscriptions.push(output, changed, vscode.window.createTreeView('learningArena.today', {treeDataProvider: provider}));
  const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 60);
  bar.text = '$(book) Learning Arena'; bar.tooltip = 'Open your current exercise';
  bar.command = 'learningArena.open'; bar.show(); context.subscriptions.push(bar);

  async function openExercise() {
    const c = core.current(root);
    await vscode.window.showTextDocument(vscode.Uri.file(c.code), {viewColumn: vscode.ViewColumn.One, preview: false});
    await vscode.commands.executeCommand('markdown.showPreviewToSide', vscode.Uri.file(c.prompt));
    await vscode.window.showTextDocument(vscode.Uri.file(c.code), {viewColumn: vscode.ViewColumn.One, preview: false});
    mark('opened current exercise');
  }
  async function saveCurrent() {
    const c = core.current(root);
    for (const doc of vscode.workspace.textDocuments) {
      if ([c.code, c.notes, c.prompt].includes(doc.uri.fsPath) && doc.isDirty && !await doc.save()) {
        throw new Error('Save the current exercise before continuing.');
      }
    }
    return c;
  }
  const actions = {
    open: openExercise,
    notes: () => vscode.window.showTextDocument(vscode.Uri.file(core.current(root).notes), {preview: false}),
    progress: () => vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(path.join(root, 'PROGRESS.md'))),
    github: () => vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(path.join(root, 'docs', 'GITHUB.md'))),
    tutor: async () => {
      let url = core.local(root).tutorUrl;
      if (!url) {
        url = await vscode.window.showInputBox({prompt: 'Paste the URL of your existing GPT web tutoring conversation',
          validateInput: value => /^https:\/\/chatgpt\.com\//.test(value) ? null : 'Use an https://chatgpt.com/ conversation URL.'});
        if (!url) return;
        core.writeJson(path.join(root, '.arena', 'local.json'), {...core.local(root), tutorUrl: url});
      }
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' || parsed.hostname !== 'chatgpt.com') throw new Error('Tutor URL must be on chatgpt.com.');
      await vscode.env.openExternal(vscode.Uri.parse(url));
    },
    copy: async () => {
      await saveCurrent();
      const assistance = await vscode.window.showQuickPick([
        'No help on this attempt', 'Hint or explanation used', 'Solution code viewed or used', 'Not specified'
      ], {title: 'What help did you use on this attempt?', placeHolder: 'This records assistance, not mastery.'});
      if (!assistance) return;
      const result = core.capture(root, assistance);
      await vscode.env.clipboard.writeText(result.packet);
      mark('captured attempt and copied review packet');
      const choice = await vscode.window.showInformationMessage('Attempt saved and copied. Paste it in your GPT web tutoring chat.', 'Open tutor', 'Open packet');
      if (choice === 'Open tutor') await actions.tutor();
      if (choice === 'Open packet') await vscode.window.showTextDocument(vscode.Uri.file(result.packetPath));
    },
    run: async () => {
      if (busy) return;
      await saveCurrent(); busy = true; output.clear(); output.show(true);
      output.appendLine(`Running ${core.current(root).exercise} with real Python. No correctness grade is assigned.\n`);
      try {
        const result = await core.run(root, text => output.append(text));
        output.appendLine(`\nExit: ${result.exitCode ?? result.signal}. ${result.stopped ? 'Stopped at the time/output limit.' : ''}`);
        mark('ran current attempt');
      } finally { busy = false; }
    },
    debug: async () => {
      const c = await saveCurrent();
      await vscode.debug.startDebugging(folder, {name: 'Learning Arena: inspect my code', type: 'debugpy',
        request: 'launch', program: c.code, python: core.python(root), cwd: c.dir,
        console: 'integratedTerminal', justMyCode: true, stopOnEntry: true});
    },
    feedback: async () => {
      const text = await vscode.env.clipboard.readText();
      if (!text.trim()) throw new Error('Copy the tutor feedback first.');
      const p = path.join(root, '.arena', 'feedback', core.current(root).exercise, core.stamp() + '.md');
      core.write(p, text); mark('saved private tutor feedback');
      await vscode.window.showTextDocument(vscode.Uri.file(p), {preview: false});
      vscode.window.showInformationMessage('Saved locally, excluded from Git. Put your own learning summary in notes.md.');
    },
    checkpoint: async () => {
      await saveCurrent();
      const message = await vscode.window.showInputBox({title: 'Save this exercise in local Git',
        prompt: 'Briefly describe the real work you did. This does not upload or mark the skill mastered.',
        placeHolder: 'e.g. initial attempt, repaired index handling, or delayed revisit',
        validateInput: s => s.trim() ? null : 'Describe what changed.'});
      if (!message) return;
      const result = core.checkpoint(root, message.trim()); mark('saved local checkpoint');
      vscode.window.showInformationMessage(result);
    },
    new: async () => {
      const prompt = await vscode.env.clipboard.readText();
      if (!prompt.trim()) throw new Error('Copy the new exercise from GPT web first.');
      const title = await vscode.window.showInputBox({title: 'New exercise from clipboard',
        prompt: 'Short exercise title. The clipboard will become prompt.md.',
        validateInput: s => /[a-z0-9]/i.test(s) ? null : 'Use a title with letters or numbers.'});
      if (!title) return;
      await saveCurrent(); core.newExercise(root, title, prompt); await openExercise();
    },
    select: async () => {
      const ids = fs.readdirSync(path.join(root, 'exercises')).filter(n => /^\d{4,}-[a-z0-9-]+$/.test(n)).sort();
      const selected = await vscode.window.showQuickPick(ids, {title: 'Revisit an existing exercise'});
      if (!selected) return;
      await saveCurrent(); core.selectExercise(root, selected); await openExercise();
    },
    handoff: async () => {
      await vscode.env.clipboard.writeText(core.read(path.join(root, 'docs', 'TUTOR_HANDOFF.md')));
      vscode.window.showInformationMessage('One-time tutor handoff copied. Paste it into your existing chat when ready.');
    }
  };
  for (const [name, action] of Object.entries(actions)) {
    context.subscriptions.push(vscode.commands.registerCommand(`learningArena.${name}`, async () => {
      if (!vscode.workspace.isTrusted) { vscode.window.showWarningMessage('Trust this workspace before using the arena tools.'); return; }
      try { await action(); } catch (error) { output.appendLine(error.stack || error.message); vscode.window.showErrorMessage(error.message); }
    }));
  }
  require('./external.cjs').install(context, {root, folder, saveCurrent, openExercise, output});
  await vscode.commands.executeCommand('setContext', 'learningArena.active', true);
  dailyMode=require('./daily.cjs').install(context,{root,saveCurrent,openExercise,openTutor:actions.tutor,changed,output});
  mark('extension activated');
  if (!context.workspaceState.get('opened')) {
    context.workspaceState.update('opened', true);
    vscode.commands.executeCommand('workbench.view.extension.learningArena');
    openExercise().catch(error => output.appendLine(error.message));
  }
}
module.exports = {activate};
