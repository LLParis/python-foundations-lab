# Python Foundations Lab · Learning Arena

A personal workspace for learning to derive, implement, explain, and improve
programs independently, progressing toward demanding software interviews and AI research.

GPT web runs the lessons. VS Code is the place to write, run, debug, and keep the
work. Git preserves real attempts. The workspace tools make no model/API calls.

## Start

Double-click **Open Learning Arena.cmd**. In VS Code, click the **Learning Arena**
icon in the left activity bar. Your current prompt and Python draft open together.

1. **Write current attempt** — work in `attempt.py`; use `notes.md` for predictions
   or explanations when the tutor asks for them.
2. **Copy attempt for tutor** — save the code, choose the help you used, and copy a
   complete review packet. Paste it in your existing GPT web chat. You never need
   to retype the code there. The packet is also saved locally for attachment.
3. **Run when ready** — executes real Python and records output. **Debug current
   attempt** lets you use breakpoints and step through values. Respect prediction
   exercises that ask you not to run yet.
4. **Save tutor feedback from clipboard** — optionally retain the feedback locally.
   It is excluded from Git; put your own learning summary in `notes.md`.
5. **Save local checkpoint** — records this exercise in Git. Nothing is uploaded.
6. For the next exercise, copy the tutor's task and choose **New exercise from
   clipboard**. Previous exercises and captures remain intact.

**Ctrl+Alt+C** copies the current attempt for the tutor. **Ctrl+Alt+R** runs it when
ready. **Ctrl+Alt+N** starts an exercise from the copied prompt. All commands are
also under **Learning Arena** in Ctrl+Shift+P.

Use the ordinary Python terminal for interactive programs requiring `input()`;
the arena's captured runner is for short noninteractive exercises and stops after
30 seconds. The runner executes your code locally, with normal filesystem access.

## Files that matter

| File | Purpose |
| --- | --- |
| `exercises/<id>/prompt.md` | The task assigned by GPT web |
| `exercises/<id>/attempt.py` | The learner's editable attempt |
| `exercises/<id>/notes.md` | Predictions, reasoning, repairs, and revisit notes |
| `exercises/<id>/captures/` | Dated copies made when sending an attempt for review |
| `CURRENT.json` | The exercise currently open |
| `PROGRESS.md` | Evidence and the current learning checkpoint |
| `.arena/` | Private tutor link, raw feedback, run output, and temporary packets |

## GitHub and the public portfolio

This continues [LLParis/python-foundations-lab](https://github.com/LLParis/python-foundations-lab).
Its earlier course roadmap is preserved in [the archive](../archive/codecademy-2026-09-19/ARCHIVE.md).
See [GitHub setup](GITHUB.md) for sharing your new work and connecting the tutor.
The entire old research/career repository and the PDF transcript are **not** part
of this repository. Review what you share before making a repository public.

Selected exercises can show reasoning, bugs, revisions, and explanations. Larger
independently understood projects will eventually be stronger portfolio material.
Do not manufacture streaks or call assisted work independent. Keep confidential
assessments and restricted problem statements out of a public repository.

## Attribution

The workspace, extension, documentation, and setup were built with Codex assistance.
Exercise 0001 starts with London's unchanged, unfinished draft from GPT web.
Setup and tooling checks are not learner solutions, completed lessons, or research
accomplishments. No exercise solutions were generated as part of setup.

## Maintenance

The local extension source is in `tools/vscode-extension/`. It has no runtime
dependencies outside VS Code and Node's standard library. Reinstall with
`powershell -ExecutionPolicy Bypass -File tools/install.ps1` after changing it.
The arena profile is separate from your everyday VS Code profile.

[Tutor handoff](TUTOR_HANDOFF.md) · [Learning context](LEARNING_CONTEXT.md)
· [Research used for setup](SOURCES.md)
