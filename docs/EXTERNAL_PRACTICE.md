# External practice in the Learning Arena

GPT web remains the teacher. The active foundations lesson is unchanged. When
the tutor chooses an appropriate external problem, the arena can preserve the
attempt, link the platform result, and include the context in tutor handoffs.

## The daily loop when ready

1. Use **Profiles & future practice sets** to open the selected collection or site.
2. **Start a platform exercise** takes a public problem URL, collection, and attempt
   type. It creates a new blank attempt; previous work stays saved. It does not
   download editorials, hints, company questions, or complete problem banks.
3. Write the required program/interface in VS Code. **Copy my code for submission**
   preserves a dated capture and copies code only. Submit in the platform yourself.
4. **Record result & attempt evidence** preserves the code, help used, attempt type,
   reported result, and submission link. It does not certify the linked result or
   mark a skill mastered. Finish the record before revising the code further.
5. **Copy attempt for tutor** carries platform context back to the existing lesson.
6. **Save local checkpoint** includes current practice and the platform records.
   Review and push when ready to publish. No automatic pushes are performed.

## Connections

| Platform | Integration | What it establishes |
|---|---|---|
| NeetCode | Existing native accepted-only auto-commit to `LLParis/neetcode-submissions`; arena links the profile and repository | NeetCode stores submissions made on its own site. The current connection was observed in the account settings. |
| LeetCode | On-demand public GraphQL profile read, no cookies or token | Aggregate solve counts and at most 20 recent accepted entries; interface is undocumented and may change. |
| Codeforces | Official public `user.info` and `user.status` API, respecting one call per two seconds | Rating and public submission verdicts, with unique problems deduplicated within the fetched history. Handle still needs configuration. |
| HackerRank | Profile link, public practice URL, learner-supplied result evidence | Its documented APIs/MCP are for HackerRank for Work. This arena does not claim a personal-practice statistics API. |

Profile snapshots include their source, retrieval date, and coverage. Failed
refreshes retain prior successful data instead of turning failures into zeros.
Refresh is manual and makes no model call. Account totals do not certify who
wrote the solution, what help was used, or whether the skill is retained.

NeetCode counts only problems completed on NeetCode itself. Its native GitHub sync
does not capture GPT web messages, VS Code edits, or submissions on LeetCode.
The native-sync repository remains separate, so automatic commits cannot replace
the foundations repository's README. No additional LeetSync/LeetHub extension is
needed for the configured native NeetCode connection. Its first accepted-code
upload has not yet been exercised in this setup because there were no submissions
waiting to sync.

## Collections and mastery

Blind 75 is included in NeetCode 150: completing both does not mean 225 distinct
problems. Collections are references for the tutor, not timers or assigned work.
The arena records first attempts, no-clue attempts, changed variations, delayed
re-solves, and timed attempts separately, with assistance noted. A selected
attempt type is self-report; it is not an independently administered assessment.
An accepted submission establishes the platform result for that submission.
Independent, retained, transferable ability requires the corresponding later work.

## Sources checked September 19, 2026

- [Codeforces API](https://codeforces.com/apiHelp) and [methods](https://codeforces.com/apiHelp/methods).
- [HackerRank API overview](https://support.hackerrank.com/articles/2067417637-api-overview) and [MCP scope](https://support.hackerrank.com/articles/8039945418).
- [NeetCode 150](https://neetcode.io/practice/practice/neetcode150), [Blind 75](https://neetcode.io/practice/practice/blind75), and the authenticated native GitHub settings inspected with the owner.
- LeetCode's live public GraphQL response for `CloutyCoder`: three solved problems,
  all easy; zero recent entries returned. Historical submission code was not fetched.
- [LeetSync source](https://github.com/LeetSync/LeetSync) and [current issue reports](https://github.com/LeetSync/LeetSync/issues) were reviewed as community integration evidence, not as official LeetCode support.

## Maintenance

The public adapters live in `tools/vscode-extension/platforms.cjs`. They do not
accept session cookies, passwords, API keys, private assessments, or arbitrary
network targets. Platform changes should be handled explicitly; do not hide a
broken refresh behind guessed counts or synthetic activity.
