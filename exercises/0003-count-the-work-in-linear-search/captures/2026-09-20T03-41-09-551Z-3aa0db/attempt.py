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