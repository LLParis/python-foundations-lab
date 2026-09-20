# One shortcut to request review

After the one-time setup, press **Ctrl+Alt+Enter** in the Learning Arena:

1. VS Code saves and publishes the exact attempt to GitHub.
2. The bridge focuses your existing GPT web tutor tab, opening it only if absent.
3. It sends a review request naming the repository, exact attempt ID and commit.
4. GPT web reviews that file and publishes the next action into `tutor/active.json`.
5. The prompt preview updates when VS Code receives that change.

The bridge does not run your code or generate lessons. It uses the existing
signed-in ChatGPT tab and its selected model. There are no API keys, paid API
requests, recurring Codex agents, or model calls in the bridge itself. Normal
ChatGPT usage still applies to the tutor's response.

The automatic message identifies the submission and requests the next prompt
update. Teaching choices and use of the tutor's available tools stay with GPT web
and your instructions; the bridge does not carry forward old lesson restrictions.

## Install once in Chrome

The local host is registered by running `tools/browser-bridge/install.py` with the
arena's Python environment. This registers only this bridge under your Windows
user account; it does not install a browser extension silently.

In the Chrome profile where you use your tutor:

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the repository's `tools/browser-extension`
   folder.
3. Confirm **Learning Arena Tutor Bridge** appears without an error.

The extension requests access to **chatgpt.com** and the local native-messaging
host. Chrome grants access at the website level; the implementation sends only
to the exact tutor conversation stored in private `.arena/local.json`. It does
not read cookies, credentials, other websites, or conversation history. It uses
the visible composer and Send button, so future ChatGPT interface changes may
require a bridge update. Review the source before enabling it.

## Daily behavior

Keep Chrome and the Learning Arena open. Requests are created only when you press
Ready, after successful publication. They expire after five minutes. Repeating
Ready on an already sent attempt does not send another message.

If you have an unsent ChatGPT draft, the tutor is still replying, or sign-in is
needed, the bridge leaves that state alone and reports that it needs attention.
Resolve it and press Ready again. If a send was attempted but confirmation was
lost, it stops instead of risking a duplicate message; check your tutor tab.

The status bar distinguishes **published**, **review requested**, and **prompt
updated**. A successful browser send alone does not prove the tutor read GitHub
or wrote a new exercise. A disconnected bridge leaves the published attempt safe
and offers the exact review request to copy, without spawning a tab each time.

## Remove

Remove **Learning Arena Tutor Bridge** from Chrome to stop automatic messaging.
The optional native-host registration can be removed from
`HKCU\Software\Google\Chrome\NativeMessagingHosts\com.llparis.learning_arena`.
Your exercises, tutor conversation, and GitHub history are unaffected.

## Implementation references

- [Chrome native messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
- [Chrome tab control](https://developer.chrome.com/docs/extensions/reference/api/tabs)
- [Chrome content scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

This is a local browser integration, not an official ChatGPT messaging API.
