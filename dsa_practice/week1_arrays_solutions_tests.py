from week1_arrays_solutions import (
    linear_search,
    binary_search_sorted,
    reverse_array_two_pointers,
    is_palindrome_string,
    two_sum_sorted,
    prefix_sum_array,
    max_profit_one_trade,
    contains_duplicate,
)


def run_test(name, fn):
    try:
        fn()
        print(f"PASS: {name}")
        return True
    except AssertionError as e:
        print(f"FAIL: {name} -> {e}")
        return False


def test_linear_search():
    assert linear_search([4, 1, 9, 2], 9) == 2
    assert linear_search([4, 1, 9, 2], 5) == -1


def test_binary_search_sorted():
    assert binary_search_sorted([1, 3, 5, 7, 9], 7) == 3
    assert binary_search_sorted([1, 3, 5, 7, 9], 4) == -1


def test_reverse_array_two_pointers():
    assert reverse_array_two_pointers([1, 2, 3]) == [3, 2, 1]
    assert reverse_array_two_pointers([]) == []


def test_is_palindrome_string():
    assert is_palindrome_string("Race car") is True
    assert is_palindrome_string("hello") is False


def test_two_sum_sorted():
    assert two_sum_sorted([1, 2, 4, 7, 11], 9) == (1, 3)
    assert two_sum_sorted([1, 2, 4, 7, 11], 20) is None


def test_prefix_sum_array():
    assert prefix_sum_array([2, 1, 3]) == [2, 3, 6]
    assert prefix_sum_array([]) == []


def test_max_profit_one_trade():
    assert max_profit_one_trade([7, 1, 5, 3, 6, 4]) == 5
    assert max_profit_one_trade([7, 6, 4, 3, 1]) == 0


def test_contains_duplicate():
    assert contains_duplicate([1, 2, 3, 1]) is True
    assert contains_duplicate([1, 2, 3]) is False


def main():
    tests = [
        ("linear_search", test_linear_search),
        ("binary_search_sorted", test_binary_search_sorted),
        ("reverse_array_two_pointers", test_reverse_array_two_pointers),
        ("is_palindrome_string", test_is_palindrome_string),
        ("two_sum_sorted", test_two_sum_sorted),
        ("prefix_sum_array", test_prefix_sum_array),
        ("max_profit_one_trade", test_max_profit_one_trade),
        ("contains_duplicate", test_contains_duplicate),
    ]

    passed = 0
    for name, test_fn in tests:
        if run_test(name, test_fn):
            passed += 1

    total = len(tests)
    print(f"\nResult: {passed}/{total} passed")


if __name__ == "__main__":
    main()
