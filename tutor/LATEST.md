# Latest learner attempt

Exercise: **0003-count-the-work-in-linear-search** · 2026-09-20T03:32:31.211Z

Help reported: Not specified

Status: ready for tutor review; no mastery claim.

## Task

# Count the work in linear search

# Count the work in your linear search

Keep the same `find_index` function. Do not run the program for this step.

Using the list `[7, 2, 5, 2, 9]`, add four visible comment lines at the bottom of the file. For each target below, predict how many times this comparison executes before the function returns:

`numbers[index] == target`

Targets:
- `7`
- `2`
- `9`
- `6`

Then add two more comment lines answering:
- Which target above is the cheapest search, and why?
- Which target above is the most expensive search, and why?

Count comparisons, not list positions. Submit with **Ready for review** without running.


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






# 1
# 2
# 5
# never

# 7
# 6
```

## Reasoning

# My reasoning

## Prediction before running


## Approach


## Help and repairs


## Next revisit


