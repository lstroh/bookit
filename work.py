def divide(a, b):
    if not isinstance(a, (int, float)) or not isinstance(b, (int, float)):
        print("input error")
        return None
    if b == 0:
        print("Cannot divide by zero")
        return None
    return a / b
divide(10, 2)
divide(10, 0)
divide(10, "x")


