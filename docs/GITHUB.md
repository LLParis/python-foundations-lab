# Connecting GitHub

## What connects to what

VS Code writes local files. Git records revisions. GitHub holds revisions you push.
ChatGPT can use supported plugins to access external services after connection.
It does not automatically turn messages in your tutoring chat into repository
commits, and a GitHub connection cannot see unsaved local edits.

The immediate review path is **Copy attempt for tutor → paste in the existing
chat**. It contains the exact current code and works without GitHub indexing or
connector permissions. No model runs during the copy operation.

## Your existing repository

The public repository is [LLParis/python-foundations-lab](https://github.com/LLParis/python-foundations-lab).
This redesign preserves its history. GitHub CLI is authenticated separately from
your browser. To check it: `gh auth status`.

Use **Save local checkpoint**, then VS Code Source Control to inspect the changes
and push the branch you intend. After the setup change is merged into `main`, use
`main` for ordinary learning commits or merge your practice branches. Do not
manufacture activity: one meaningful checkpoint is better than fake daily commits.

Local `.arena/` feedback, tutor URLs, and run logs are ignored. Review your staged
diff before a push. The imported learner draft is unfinished; publishing it must
not be represented as a solved exercise. The old research/career repository is
not included here.

The arena never pushes on its own. A local checkpoint remains on this computer
until you push. For Git CLI after a branch has an upstream, use `git push`.

## Connect to GPT web

On September 19, 2026, the official GitHub plugin was installed and its connection
authorized for this repository. ChatGPT displayed **Try in chat** after connecting.
Retrieval from the existing tutoring conversation still needs its first actual
use; installing the connection does not itself demonstrate that read.

In ChatGPT's Plugins area, open GitHub and connect the intended GitHub account if
offered. Review requested permissions and select only this repository where the
connection supports that choice. Availability and prompts depend on your account.

In the existing tutoring chat, explicitly ask the tutor to use GitHub to read
`CURRENT.json`, then the current `prompt.md`, `attempt.py`, and `notes.md`.
Have it identify the exercise and the retrieved revision before reviewing.
If files are missing or stale, send the exact current packet. A successful
connection is not evidence that every push is instantly available in every chat.

## Presenting work

GitHub profiles support pinned repositories and contribution history. Private
contribution counts can be shown without exposing repository details. Recruiters
cannot inspect private code without access.

Build a public selection of work you can explain: a clear problem, your approach,
tests you understand, meaningful improvements, limitations, and attribution.
Keep earlier imperfect attempts when useful to explain learning, but do not
publish personal conversations, private application material, or restricted
assessment questions. Do not represent this Codex-built workspace as your own
independently implemented project.
