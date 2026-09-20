(() => {
  if (globalThis.learningArenaBridgeInstalled) return;
  globalThis.learningArenaBridgeInstalled = true;
  let busy = false;
  const pause = ms => new Promise(resolve=>setTimeout(resolve,ms));
  const visible = node => node && node.getClientRects().length > 0;
  async function send(request) {
    if (busy) return {status:'blocked',detail:'A review request is already being sent.'};
    busy=true;
    let clicked=false;
    try {
      if(location.origin+location.pathname.replace(/\/$/,'') !== request.url) throw new Error('Tutor conversation changed.');
      if(Date.now()>request.expiresAt) throw new Error('Review request expired. Press Ready again.');
      const key='arena:'+request.attemptId;
      const saved=(await chrome.storage.local.get(key))[key];
      if(saved === 'sent') return {status:'sent'};
      if(saved === 'sending') return {status:'uncertain',detail:'An earlier send is unconfirmed. Check your tutor before retrying.'};
      const editor=document.getElementById('prompt-textarea');
      if(!visible(editor)) throw new Error('Open and sign into the tutor conversation, then press Ready again.');
      if((editor.innerText || editor.value || '').trim()) throw new Error('Your ChatGPT draft is preserved. Send or clear it, then press Ready again.');
      if([...document.querySelectorAll('button')].some(b=>visible(b) && /stop (generating|streaming)/i.test(b.getAttribute('aria-label')||''))) throw new Error('The tutor is still responding. Wait for it to finish, then press Ready again.');
      const form=editor.closest('form');
      if(!form || form.querySelector('input[type="file"]')?.files?.length) throw new Error('The tutor composer is not ready.');
      // Normal editor input in the isolated content-script world; no private APIs,
      // cookies, session tokens, framework internals, or response extraction.
      editor.focus();
      if(editor.isContentEditable) {
        if(!document.execCommand('insertText',false,request.text)) throw new Error('Could not enter the review request.');
      } else {
        const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')?.set;
        if(!setter) throw new Error('Unsupported tutor composer.');
        setter.call(editor,request.text);editor.dispatchEvent(new Event('input',{bubbles:true}));
      }
      let button;
      for(let i=0;i<30;i++) {
        button=[...form.querySelectorAll('button')].find(b=>visible(b) && /^(send|send message|send prompt)$/i.test(b.getAttribute('aria-label')||''));
        if(button && !button.disabled) break;
        await pause(200);
      }
      if(!button || button.disabled) throw new Error('Review request is in the composer; press Send to finish.');
      if((editor.innerText || editor.value || '').trim() !== request.text.trim()) throw new Error('Composer changed; your text has been preserved.');
      if(location.origin+location.pathname.replace(/\/$/,'') !== request.url || Date.now()>request.expiresAt) throw new Error('Tutor destination changed or the request expired.');
      await chrome.storage.local.set({[key]:'sending'});
      button.click();clicked=true;
      for(let i=0;i<50;i++) {
        await pause(200);
        // Empty composer confirms the visible submission action was accepted;
        // it does not assert the tutor read GitHub or completed its response.
        if(!(editor.innerText || editor.value || '').trim()) {
          await chrome.storage.local.set({[key]:'sent'});
          return {status:'sent'};
        }
      }
      return {status:'uncertain',detail:'Send was clicked but not confirmed. Check the tutor conversation.'};
    } catch(error) {return {status:clicked?'uncertain':'blocked',detail:error.message};}
    finally {busy=false;}
  }
  chrome.runtime.onMessage.addListener((message,sender,respond)=>{
    if(sender.id !== chrome.runtime.id || message?.type !== 'arena-review') return;
    void send(message.request).then(respond);
    return true;
  });
})();
