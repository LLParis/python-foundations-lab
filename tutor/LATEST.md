# Latest learner attempt

Exercise: **0001-find-index** · 2026-09-20T02:36:48.454Z

Help reported: Not specified

Status: ready for tutor review; no mastery claim.

## Task

# Repair the reusable search function

Your submitted function finds the present target, but it still needs to satisfy the full exercise contract. Repair the same exercise from your current code.

Requirements:

- Keep the function name `find_index(numbers, target)`.
- The function itself must begin with a not-found result of `-1`; do not depend on a result variable outside the function.
- Search through the indices of `numbers`.
- If the target is found, preserve that index as the result and stop searching.
- Return the result for both cases: target found and target absent.
- Make sure every statement in the function is reachable; remove or restructure any statement that can never execute.
- Keep the existing call with `[5, 1, 9, 4]` and target `9`, store the returned value in `answer`, and print it.
- In your reasoning notes, predict what the function should return for the existing target `9` and for an absent target such as `6`.

Do not run the program yet. Make the repair from reasoning, then submit it with **Ready for review**.

## Code at review cutoff

```python
numbers = [5, 1, 9, 4]
target = 9
result = -1




def find_index(numbers, target):

   for index in range(len(numbers)):
      if numbers[index]  == target:
         result = index
         
      break
   return result

answer = find_index(numbers, target)
print(answer)














```

## Reasoning

# My reasoning

## What I expect before running


## Why my approach should work


## What I needed help with


## What I learned after feedback


## Next revisit



