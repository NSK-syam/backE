from typing import List, Optional, Tuple


def linear_search(nums: List[int], target: int) -> int:
    # Time: O(n), Space: O(1)
    for i, value in enumerate(nums):
        if value == target:
            return i
    return -1


def binary_search_sorted(nums: List[int], target: int) -> int:
    # Time: O(log n), Space: O(1)
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
    # Time: O(n), Space: O(n) due to new list
    result = nums[:]
    left, right = 0, len(result) - 1
    while left < right:
        result[left], result[right] = result[right], result[left]
        left += 1
        right -= 1
    return result


def is_palindrome_string(s: str) -> bool:
    # Time: O(n), Space: O(n)
    cleaned = ''.join(ch.lower() for ch in s if ch != ' ')
    left, right = 0, len(cleaned) - 1
    while left < right:
        if cleaned[left] != cleaned[right]:
            return False
        left += 1
        right -= 1
    return True


def two_sum_sorted(nums: List[int], target: int) -> Optional[Tuple[int, int]]:
    # Time: O(n), Space: O(1)
    left, right = 0, len(nums) - 1
    while left < right:
        current = nums[left] + nums[right]
        if current == target:
            return (left, right)
        if current < target:
            left += 1
        else:
            right -= 1
    return None


def prefix_sum_array(nums: List[int]) -> List[int]:
    # Time: O(n), Space: O(n)
    prefix = []
    running = 0
    for value in nums:
        running += value
        prefix.append(running)
    return prefix


def max_profit_one_trade(prices: List[int]) -> int:
    # Time: O(n), Space: O(1)
    min_price = float('inf')
    best = 0
    for price in prices:
        if price < min_price:
            min_price = price
        else:
            best = max(best, price - min_price)
    return best


def contains_duplicate(nums: List[int]) -> bool:
    # Time: O(n), Space: O(n)
    seen = set()
    for value in nums:
        if value in seen:
            return True
        seen.add(value)
    return False
