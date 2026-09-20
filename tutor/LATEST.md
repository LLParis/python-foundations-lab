# Latest learner attempt

Exercise: **0001-find-index** · 2026-09-20T02:49:45.419Z

Help reported: Not specified

Status: ready for tutor review; no mastery claim.

## Task

# Repair `find_index` using this scaffold

The key issue is indentation: `break` must happen only when the target matches.

Use this scaffold and fill the blanks yourself:

```python
def find_index(numbers, target):
    result = -1

    for index in range(len(numbers)):
        if __________________________:
            result = __________
            break

    return __________

answer = __________________________
print(answer)
```

Keep the existing inputs `[5, 1, 9, 4]` and target `9` above the function.

Before editing, mentally trace the loop:
- index 0 -> value 5: no match, so keep going
- index 1 -> value 1: no match, so keep going
- index 2 -> value 9: match, save index 2, then stop

Do not run the program yet. Fill the blanks from this reasoning and submit with **Ready for review**.

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



