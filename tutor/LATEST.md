# Latest learner attempt

Exercise: **0003-count-the-work-in-linear-search** · 2026-09-20T03:41:09.552Z

Help reported: Not specified

Status: ready for tutor review; no mastery claim.

## Task

# Repair the comparison counts

Keep the `find_index` function unchanged. Do not run the program.

Your job is only to replace the six bottom comments with clearly labeled answers in this form:

```python
# target 7 comparisons = ...
# target 2 comparisons = ...
# target 9 comparisons = ...
# target 6 comparisons = ...
# cheapest = ... because ...
# most expensive = ... because ...
```

Important: an absent target still causes `numbers[index] == target` to execute once for every element checked. `break` only stops the loop when a match occurs.

Count comparison executions, not whether a match ever happens. Submit with **Ready for review** without running.

## Code at review cutoff

```python
# Write your own attempt here.
numbers = [7, 2, 5, 2, 9]
target_1 = 7
target_2 = 2
target_3 = 9
target_4 = 6

def find_index(numbers, target):
    result = -1
    for index in range(len(numbers)):
        if numbers[index] == target:
            result = index
            break
    return result
answer = find_index(numbers, 7)

# target 7 comparisons = 1
# target 2 comparisons = 2
# target 9 comparisons = 5
# target 6 comparisons = 5

# cheapest = 7, because you only have to do one comparison to determine its first index
# most expensive = 9 and 6 because they both require doing 5 comparisons
```

## Reasoning

# My reasoning

## Prediction before running


## Approach


## Help and repairs


## Next revisit


