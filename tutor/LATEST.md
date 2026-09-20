# Latest learner attempt

Exercise: **0001-find-index** · 2026-09-20T02:45:47.653Z

Help reported: Not specified

Status: ready for tutor review; no mastery claim.

## Task

# Repair control flow and local result

Repair the same `find_index(numbers, target)` exercise from your submitted code.

Requirements:

- Initialize the not-found result inside the function before the loop.
- Inspect indices until either the target is found or the list is exhausted.
- Do not stop after the first element unless the first element is actually the target.
- When the target is found, save its index and stop the loop.
- Return the result after the loop so both found and absent cases are handled.
- Keep the existing call with `[5, 1, 9, 4]` and target `9`, assign the return value to `answer`, and print `answer`.

Do not run the program yet. Repair the code from reasoning, then submit with **Ready for review**.

## Code at review cutoff

```python
numbers = [5, 1, 9, 4]
target = 9





def find_index(numbers, target):
    result = -1

    for index in range(len(numbers)):
        if numbers[index] == target:
            result = index

        break














```

## Reasoning

# My reasoning

## What I expect before running


## Why my approach should work


## What I needed help with


## What I learned after feedback


## Next revisit



