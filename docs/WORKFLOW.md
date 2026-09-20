# Python Foundations Lab · Learning Arena

A personal workspace for learning to derive, implement, explain, and improve
programs independently, progressing toward demanding software interviews and AI research.

GPT web runs the lessons. VS Code is the place to write, run, debug, and keep the
work. Git preserves real attempts. The workspace tools make no model calls. The daily receiver uses the connected GitHub account to move lesson and attempt files.

## Daily use

Open the desktop Learning Arena shortcut. It opens the editor and your existing
GPT web tutor. Write in VS Code; drafts autosave. Click **Ready for review**, then
ask GPT web to **review my latest attempt**. The selected version is saved and
published automatically, and the tutor reads it directly through GitHub.

The tutor sends new exercises through the connected handoff; VS Code receives
them automatically while open. Your earlier attempts remain saved. The controls
for copying packets, creating folders, or committing manually are now optional
advanced tools, not the daily routine.

[Read the short daily guide](DAILY_USE.md). The setup-only message is in
[GPT_WEB_SETUP_MESSAGE.md](GPT_WEB_SETUP_MESSAGE.md); it does not solve or advance
any exercise. Tutor-side connection must be verified before claiming the round trip.

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
