# Latest learner attempt

Exercise: **0002-transfer-find-index-without-a-scaffold** · 2026-09-20T03:16:17.323Z

Help reported: Not specified

Status: ready for tutor review; no mastery claim.

## Task

# Verify your `find_index` transfer

Your submitted code is structurally correct by inspection. Now verify it deliberately.

1. Do not change the function logic.
2. Before running, add two comment lines at the bottom of the file that explicitly predict:
   - what `first_answer` will print
   - what `missing_answer` will print
3. Then run the program once in VS Code.
4. Compare the actual output with your two predictions.
5. Leave the prediction comments in the file and submit with **Ready for review**.

Running is allowed for this verification step.

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
# first_answer will print 2, actually ended up being 1 bc zero indexed so i was initially wrong 
# missing_answer will print -1
```

## Reasoning

# My reasoning

## Prediction before running


## Approach


## Help and repairs


## Next revisit


