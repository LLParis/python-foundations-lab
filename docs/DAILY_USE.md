# Open, practice, review

## Each session

1. **Open Learning Arena** from the desktop shortcut. It opens VS Code and the
   existing GPT web tutor. The current exercise and your draft resume in VS Code.
2. **Write your answer.** Drafts save after a short pause. Continue asking questions
   and receiving explanations in your normal GPT web conversation.
3. **Click Ready for review** in VS Code when you want feedback. It saves an exact
   review copy and publishes the selected practice code and reasoning to this
   GitHub repository. In GPT web, say **“review my latest attempt.”** The tutor
   reads that file directly; you do not retype or paste the code.

When the tutor assigns the next exercise through the connected handoff, VS Code
receives it automatically, usually within about 15 seconds. Earlier attempts stay
saved. If you have made new edits while waiting, the next exercise waits for you
instead of interrupting them.

Close the workspace whenever you stop. **Finish session** is optional: it saves
your draft and pauses the receiver. Resume learning starts it again.

## What happens automatically

- Local draft saving and a private recovery copy.
- Saving and publishing the exact review version when you click Ready.
- Keeping newer edits intact while an earlier snapshot is published.
- Receiving tutor-written exercise files while the workspace is open.
- Restoring the current exercise when the workspace opens again.
- Refreshing supported external profile statistics at session start, at most once
  per hour. NeetCode retains its own native accepted-only GitHub sync.

## What remains your choice

- Thinking, coding, asking for help, and deciding when an attempt is ready.
- Sending an ordinary message to GPT web to request review. A GitHub push does
  **not** wake the chat or send a message on your behalf.
- Running or debugging when appropriate. A prediction exercise never runs itself.
- Submitting work on an external judge when that becomes part of the curriculum.

No terminal commands, manual Git commits/pushes, exercise-folder naming, or prompt
copying belong to this normal tutor-connected loop. Advanced/manual controls remain
under **More tools** for occasional use.

VS Code may ask once to let Learning Arena use your GitHub sign-in when you first
click Ready. Choose **LLParis**. This is a one-time account permission, not a
per-exercise step. Credentials stay in VS Code's authentication system and are
passed to the Git helper only in memory.

**Ready** publishes the selected coding exercise, its code, and `notes.md`; raw
chat history and private `.arena/` files are not published. Ordinary typing only
saves locally. Repeated Ready clicks on the same version reuse the same record.

## If something is unavailable

The status bar distinguishes connected, waiting, and unpublished/offline work.
Local drafts remain available. If a publish fails, it does not say the tutor has
received it. Ready can retry the saved attempt without inventing a new completion.
Maintenance branches and unrelated staged changes pause automatic publication
instead of publishing other work.

The receiver runs inside VS Code only. It is not a scheduled Astra agent and makes
no model calls. GPT web remains the personalized teacher.
