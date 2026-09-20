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