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