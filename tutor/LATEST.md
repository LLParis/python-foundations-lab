# Latest learner attempt

Exercise: **0002-transfer-find-index-without-a-scaffold** · 2026-09-20T02:59:40.519Z

Help reported: Not specified

Status: ready for tutor review; no mastery claim.

## Task

# Transfer find_index without a scaffold

# Transfer: write `find_index` from scratch

Write a new program from scratch, without copying a scaffold.

Requirements:

- Define `find_index(numbers, target)`.
- Return the index of the first occurrence of `target`.
- If the target does not appear, return `-1`.
- Use indexed traversal with `range(len(numbers))`.
- Stop searching as soon as the first match is found.
- Use the list `[7, 2, 5, 2, 9]`.
- Call the function once with target `2` and store the result in `first_answer`.
- Call the function again with target `6` and store the result in `missing_answer`.
- Print `first_answer`, then print `missing_answer`.

Do not run it yet. Write it from memory/reasoning, then submit with **Ready for review**.


## Code at review cutoff

```python
# Write your own attempt here.
numbers = [7, 2, 5, 2, 9]
first_target = 2
second_target = 6
def find_index(numbers, target):
    result = -1

    for index in range(len(numbers)):
        if numbers[index] == target:
            result = index
            break

    return result

first_answer = find_index(numbers, first_target)
print(first_answer)
missing_answer = find_index(numbers, second_target)
print(missing_answer)
```

## Reasoning

# My reasoning

## Prediction before running


## Approach


## Help and repairs


## Next revisit


