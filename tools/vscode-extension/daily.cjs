'use strict';
const vscode = require('vscode');
const path = require('node:path');
const core = require('./core.cjs');
const daily = require('./daily-core.cjs');
const platforms = require('./platforms.cjs');

function install(context, {root,saveCurrent,openExercise,openTutor,changed,output}) {
  let timer, stopped=false, busy=false, readyInFlight=false, failures=0, status='Drafts save automatically';
  const bar=vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left,59);
  let validatedToken;
  async function githubSession(prompt=false) {
    const session=await vscode.authentication.getSession('github',['repo'],prompt ? {createIfNone:true} : {silent:true});
    if(!session) {
      if(daily.state(root).publisherAuth?.available !== false) daily.saveState(root,{publisherAuth:{available:false,source:'VS Code'}});
      return undefined;
    }
    if(validatedToken !== session.accessToken) {
      const response=await fetch('https://api.github.com/user',{headers:{Authorization:`Bearer ${session.accessToken}`,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
      if(!response.ok) throw new Error('Could not verify the VS Code GitHub account.');
      const profile=await response.json();
      if(profile.login?.toLowerCase() !== 'llparis') throw new Error('Choose LLParis for this arena’s GitHub connection.');
      validatedToken=session.accessToken;
      daily.saveState(root,{publisherAuth:{available:true,source:'VS Code',account:profile.login}});
    }
    return session.accessToken;
  }
  daily.setCredentialProvider(()=>githubSession(false));
  void githubSession(false).catch(error=>output.appendLine('Publisher account check: '+error.message));
  bar.command='learningArena.resume';
  function update(message) { status=message;bar.text='$(sync) '+message;bar.tooltip='Learning Arena daily workflow';bar.show();changed.fire(); }
  const getStatus=()=>status;
  async function poll() {
    if (stopped || busy) return;
    busy=true;
    try {
      if (await daily.git(root,['branch','--show-current']) !== 'main') {update('Daily sync paused · maintenance branch');return;}
      const lesson=await daily.fetchLesson(root);
      await saveCurrent();
      const result=daily.applyLesson(root,lesson);
      const s=daily.state(root);
      update(result.pending ? 'Next exercise waiting · your edits are safe' : s.tutorConfirmed ? 'Tutor connected · drafts autosave' : 'Daily sync ready · tutor setup pending');
      if(result.newExercise) { await openExercise();vscode.window.showInformationMessage('Your tutor’s next exercise is ready. Previous work is saved.'); }
      failures=0;
    } catch(error) {
      failures++;
      update('Offline / sync paused · drafts saved locally');
      if(failures===1) output.appendLine('Daily sync: '+error.message);
    } finally {
      busy=false;
      if(!stopped) timer=setTimeout(poll,Math.min(120000,15000*Math.max(1,failures)));
    }
  }
  async function refreshProfiles() {
    const s=daily.state(root);
    if(Date.now()-(s.profileRefreshAt||0)<3600000) return;
    daily.saveState(root,{profileRefreshAt:Date.now()});
    for(const name of ['leetcode','codeforces']) if(platforms.profiles(root)[name]?.handle) {
      try {await platforms.sync(root,name);} catch(error) {output.appendLine(`${name} refresh: ${error.message}`);}
    }
  }
  async function resume(openBrowser=true) {
    stopped=false;
    await vscode.commands.executeCommand('workbench.view.extension.learningArena');
    await openExercise();
    if(openBrowser) await openTutor();
    if(!timer && !busy) void poll();
    void refreshProfiles();
  }
  async function ready() {
    if(readyInFlight) return;
    stopped=false;
    readyInFlight=true;
    while(busy) await new Promise(resolve=>setTimeout(resolve,100));
    busy=true; clearTimeout(timer); timer=undefined;
    try {
      await saveCurrent(); daily.backup(root);
      // This is reached only after the learner clicks Ready, never by the
      // passive receiver. VS Code handles any one-time sign-in/consent UI.
      if(!await githubSession(false)) await githubSession(true);
      await daily.assertHome(root);
      let review=daily.prepareReview(root);
      if(!review.published) {
        update('Saving and publishing your review copy…');
        review=await daily.publishReview(root,review);
      }
      update('Ready on GitHub · tell GPT web “review latest”');
      await openTutor();
      vscode.window.showInformationMessage('Your exact attempt is saved and available to the tutor. In GPT web, say “review my latest attempt”. No code copying or Git commands.');
    } catch(error) {
      daily.saveState(root,{publishError:error.message});
      update('Review not published · draft preserved');output.appendLine(error.stack||error.message);
      vscode.window.showErrorMessage('Your draft is safe. Publishing could not finish: '+error.message);
    } finally {busy=false;readyInFlight=false;clearTimeout(timer);if(!stopped) timer=setTimeout(poll,15000);}
  }
  const actions={
    resume:()=>resume(true), ready,
    connectPublisher:async()=>{await githubSession(true);failures=0;clearTimeout(timer);timer=undefined;await resume(false);},
    finish:async()=>{await saveCurrent();daily.backup(root);stopped=true;clearTimeout(timer);timer=undefined;update('Session paused · draft saved');},
    assistance:async()=>{
      const value=await vscode.window.showQuickPick(platforms.helps,{title:'Help used for the current exercise (optional)'});
      if(value) {daily.saveState(root,{assistance:value});changed.fire();}
    },
    nextLesson:async()=>{
      const lesson=daily.state(root).pendingLesson;if(!lesson)return;
      await saveCurrent();daily.applyLesson(root,lesson,true);await openExercise();update('Next exercise opened · previous draft saved');
    }
  };
  for(const [name,fn] of Object.entries(actions)) context.subscriptions.push(vscode.commands.registerCommand(`learningArena.${name}`,async()=>{
    if(!vscode.workspace.isTrusted)return;
    try {await fn();}catch(error){output.appendLine(error.message);vscode.window.showErrorMessage(error.message);}
  }));
  context.subscriptions.push(bar,vscode.workspace.onDidSaveTextDocument(doc=>{
    const c=core.current(root);
    if([c.code,c.notes].some(p=>p.toLowerCase()===doc.uri.fsPath.toLowerCase())) {
      try {daily.backup(root);}catch(error){output.appendLine(error.message);}
    }
  }),{dispose(){stopped=true;clearTimeout(timer);}});
  update('Drafts save automatically');
  // Startup is local and passive: resume the exact lesson, start the transport,
  // but send no messages and run no learner code.
  if(vscode.workspace.getConfiguration('learningArena').get('dailyMode',true)) {
    void resume(false).catch(error=>output.appendLine(error.message));
  }
  return {getStatus};
}
module.exports={install};
