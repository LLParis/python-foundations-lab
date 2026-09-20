# Daily tutor-to-arena handoff

Repository: **LLParis/python-foundations-lab**. Read and write these files using the
connected GitHub plugin. Preserve London's existing conversation, curriculum,
mission, and current unfinished lesson. This protocol moves files; it does not
replace the teacher or supply learner solutions.

## One-time connection check

1. Read this file, `tutor/active.json`, `CURRENT.json`, and
   `docs/LEARNING_MISSION.md` from `main` through the GitHub tool.
2. Read `tutor/latest-attempt.json`. If its status is `not-ready`, do not review or
   advance the exercise. The current unfinished draft is not submitted work.
3. Update ONLY `tutor/active.json`: preserve the current lesson and set
   `connection` to `confirmed`, incrementing `revision`. Use the blob SHA returned
   by the read when updating. Confirm actual tool success, then tell London that
   the file handoff is connected. Do not claim a lesson was completed.

## Normal review

When London says "review latest" or otherwise requests review:

1. Read `tutor/latest-attempt.json` directly through GitHub, from `main`. Do not use
   search snippets or cached chat contents as the current attempt. Identify the
   `attemptId`, `lessonId`, and code actually retrieved.
2. If status is not `ready-for-review`, say no submitted attempt is available yet.
   London clicks **Ready for review** in VS Code; do not ask for code to be retyped.
3. Review the submitted code and reasoning. The assistance field is a learner
   report; use the actual conversation when distinguishing assisted work. Do not
   infer retained or timed mastery from acceptance or successful execution.
4. Continue ordinary teaching and feedback in this conversation. Do not overwrite
   learner code, notes, README, mission, or progress claims through GitHub.
5. After every review, publish the current next action or exercise using the
   format below, even when London is repairing the same lesson. Set `respondingTo`
   to the exact reviewed attempt ID and increment `revision`. This is required
   for the VS Code prompt preview to reflect the feedback. Keep explanations in
   chat; the prompt contains the current actionable task without a full solution.

An automated review request may include an expected attempt ID and publication
commit. Treat those as a version check: retrieve the file through GitHub, confirm
the ID matches, and report a mismatch or unavailable tool instead of silently
reviewing an old chat answer. The request has the same meaning as London clicking
Ready for review; it is not permission to run or replace learner code.

## Delivering the current or next exercise

Write ONLY `tutor/active.json`, using its fresh blob SHA. The complete JSON is:

```json
{
  "schema": 1,
  "lessonId": "unique-lowercase-lesson-id",
  "revision": 1,
  "title": "Short exercise title",
  "prompt": "The exact exercise in Markdown, with requirements and examples as appropriate. No complete answer.",
  "allowRun": false,
  "respondingTo": "the-attemptId-just-reviewed-or-null",
  "connection": "confirmed"
}
```

`respondingTo` is a JSON null during setup or a string containing the exact reviewed
attempt ID. Keep `lessonId` for the same exercise, and increment `revision` when
clarifying its prompt or changing whether execution is appropriate. Use a new
unique ID for a genuinely new exercise. Do not change IDs merely for a hint.

The arena checks roughly every 15 seconds while open. It preserves previous work
and opens the next exercise automatically only when it corresponds to the last
submitted attempt and no newer learner edits would be interrupted. Otherwise it
keeps the next exercise waiting for the learner to open.

The prompt is public lesson material. Include only the coding task; do not copy
private conversation history, personal details, confidential assessments, API
keys, or full solutions into it. Feedback stays in the tutor conversation.

An allowed run is never executed automatically. No GitHub write should claim a
new learner success unless the actual submitted work establishes it.

## Connection errors

If GitHub is unavailable, lacks permission, or a write fails, state that plainly.
Do not claim synchronization completed, fabricate a commit, or silently restart
the curriculum. The existing conversation and local draft remain available.
