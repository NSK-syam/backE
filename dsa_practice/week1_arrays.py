from typing import List, Optional, Tuple


# Fill all TODO functions.
# Write complexity above each function after you solve it.


def linear_search(nums: List[int], target: int) -> int:
    for i, num in enumerate(nums):
        if num == target:
            return i
    return -1


def binary_search_sorted(nums: List[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1


def reverse_array_two_pointers(nums: List[int]) -> List[int]:
    # TODO: reverse using two pointers
    # return a NEW reversed list
    raise NotImplementedError


def is_palindrome_string(s: str) -> bool:
    # TODO: ignore spaces and case
    # "Race car" -> True
    raise NotImplementedError


def two_sum_sorted(nums: List[int], target: int) -> Optional[Tuple[int, int]]:
    # TODO: nums is sorted
    # return pair of indices (i, j) where nums[i] + nums[j] == target
    # if not found return None
    raise NotImplementedError


def prefix_sum_array(nums: List[int]) -> List[int]:
    # TODO: prefix sum
    # [2, 1, 3] -> [2, 3, 6]
    raise NotImplementedError


def max_profit_one_trade(prices: List[int]) -> int:
    # TODO: best time to buy and sell stock (one transaction)
    # return max profit
    raise NotImplementedError


def contains_duplicate(nums: List[int]) -> bool:
    # TODO: return True if any number repeats
    raise NotImplementedError
