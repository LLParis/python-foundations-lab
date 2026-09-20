'use strict';
let port, timer, working = false, serial = 0;
const calls = new Map();
function rpc(op, data = {}) {
  return new Promise((resolve,reject) => {
    if (!port) return reject(new Error('Local bridge is disconnected.'));
    const id = ++serial;
    const timeout = setTimeout(() => {calls.delete(id);reject(new Error('Local bridge timed out.'));}, 8000);
    calls.set(id, {resolve,reject,timeout});
    port.postMessage({op,rpc:id,...data});
  });
}
async function badge(text, title) {
  await chrome.action.setBadgeText({text});
  await chrome.action.setBadgeBackgroundColor({color: text === '!' ? '#b45309' : '#087f8c'});
  await chrome.action.setTitle({title});
}
async function deliver(request) {
  if (!/^https:\/\/chatgpt\.com\/c\/[a-f0-9-]+$/.test(request.url) || typeof request.text !== 'string' || request.text.length > 5000) return;
  const claimed = await rpc('claim', {requestId:request.requestId});
  if (!claimed.ok) return;
  let result = {status:'blocked', detail:'Could not open the tutor tab.'};
  let dispatched = false;
  try {
    const tabs = (await chrome.tabs.query({url:'https://chatgpt.com/*'})).filter(t => t.url?.split(/[?#]/)[0].replace(/\/$/,'') === request.url);
    let tab = tabs.find(t => t.active) || tabs[0];
    if (tab) {
      await chrome.windows.update(tab.windowId,{focused:true});
      tab = await chrome.tabs.update(tab.id,{active:true});
    } else tab = await chrome.tabs.create({url:request.url,active:true});
    for (let i=0; i<60; i++) {
      tab = await chrome.tabs.get(tab.id);
      if (tab.status === 'complete') break;
      await new Promise(resolve=>setTimeout(resolve,500));
    }
    if (tab.url?.split(/[?#]/)[0].replace(/\/$/,'') !== request.url) throw new Error('The browser did not reach the configured tutor conversation.');
    await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});
    // Once dispatched, a missing acknowledgment is uncertain, never auto-retried.
    dispatched = true;
    result = await chrome.tabs.sendMessage(tab.id,{type:'arena-review',request});
    if (!['sent','blocked','uncertain'].includes(result?.status)) result={status:'uncertain',detail:'Browser returned no delivery receipt.'};
  } catch(error) {
    result={status:dispatched ? 'uncertain' : 'blocked',detail:error.message};
  }
  await rpc('report',{requestId:request.requestId,...result});
  await badge(result.status === 'sent' ? 'OK' : '!', result.status === 'sent' ? 'Review request sent to your tutor' : result.detail);
}
async function tick() {
  if (working || !port) return;
  working = true;
  try {const {request} = await rpc('poll');if(request) await deliver(request);}
  catch(error) {await badge('!',error.message);}
  finally {working=false;}
}
function connect() {
  if (port) return;
  port=chrome.runtime.connectNative('com.llparis.learning_arena');
  port.onMessage.addListener(message=>{
    const call=calls.get(message.rpc);if(!call)return;
    calls.delete(message.rpc);clearTimeout(call.timeout);call.resolve(message);
  });
  port.onDisconnect.addListener(()=>{
    const reason=chrome.runtime.lastError?.message || 'Local bridge disconnected';
    port=null;clearInterval(timer);
    for(const call of calls.values()){clearTimeout(call.timeout);call.reject(new Error(reason));}
    calls.clear();void badge('!',reason);
  });
  timer=setInterval(tick,2000);
  void tick();
}
chrome.runtime.onInstalled.addListener(()=>{chrome.alarms.create('reconnect',{periodInMinutes:1});connect();});
chrome.runtime.onStartup.addListener(connect);
chrome.alarms.onAlarm.addListener(connect);
chrome.action.onClicked.addListener(()=>{connect();void tick();});
connect();
