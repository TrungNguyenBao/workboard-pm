"""VN personal income tax and social insurance calculation utilities.

Hardcoded 2024 Vietnam tax law constants. Pure functions — no DB access.
"""

# Social insurance caps (monthly, VND)
_BHXH_CAP = 36_400_000   # 20x base salary (1,820,000 * 20)
_BHTN_CAP = 29_800_000   # max wage for unemployment insurance

# Employee contribution rates
_BHXH_EMPLOYEE_RATE = 0.08    # 8%
_BHYT_EMPLOYEE_RATE = 0.015   # 1.5%
_BHTN_EMPLOYEE_RATE = 0.01    # 1%

# PIT progressive brackets: (upper_bound, rate)
# Final bracket has upper_bound=None meaning no cap
_PIT_BRACKETS: list[tuple[float | None, float]] = [
    (5_000_000, 0.05),
    (10_000_000, 0.10),
    (18_000_000, 0.15),
    (32_000_000, 0.20),
    (52_000_000, 0.25),
    (80_000_000, 0.30),
    (None, 0.35),
]

# Personal deductions (monthly)
_PERSONAL_DEDUCTION = 11_000_000
_DEPENDENT_DEDUCTION = 4_400_000


def calculate_bhxh_employee(base_salary: float) -> float:
    """Employee BHXH contribution: 8% of base salary, capped at 36.4M."""
    return min(base_salary, _BHXH_CAP) * _BHXH_EMPLOYEE_RATE


def calculate_bhyt_employee(base_salary: float) -> float:
    """Employee BHYT contribution: 1.5% of base salary (no cap)."""
    return base_salary * _BHYT_EMPLOYEE_RATE


def calculate_bhtn_employee(base_salary: float) -> float:
    """Employee BHTN contribution: 1% of base salary, capped at 29.8M."""
    return min(base_salary, _BHTN_CAP) * _BHTN_EMPLOYEE_RATE


def calculate_pit(gross_salary: float, dependents: int = 0) -> float:
    """Calculate VN personal income tax using 2024 progressive brackets.

    Steps:
      1. Subtract BHXH+BHYT+BHTN employee contributions from gross -> assessable income
      2. Subtract personal deduction (11M) + dependent deductions (4.4M each)
      3. Apply progressive tax brackets to taxable income
    """
    bhxh = calculate_bhxh_employee(gross_salary)
    bhyt = calculate_bhyt_employee(gross_salary)
    bhtn = calculate_bhtn_employee(gross_salary)

    assessable = gross_salary - bhxh - bhyt - bhtn
    deduction = _PERSONAL_DEDUCTION + (dependents * _DEPENDENT_DEDUCTION)
    taxable = max(assessable - deduction, 0.0)

    tax = 0.0
    prev_upper = 0.0
    for upper, rate in _PIT_BRACKETS:
        if upper is None:
            tax += taxable * rate
            break
        bracket_size = upper - prev_upper
        if taxable <= bracket_size:
            tax += taxable * rate
            break
        tax += bracket_size * rate
        taxable -= bracket_size
        prev_upper = upper

    return round(tax, 2)


def calculate_net_salary(
    gross_salary: float,
    dependents: int = 0,
    other_allowances: float = 0.0,
) -> dict[str, float]:
    """Return a full payroll breakdown dict."""
    bhxh = calculate_bhxh_employee(gross_salary)
    bhyt = calculate_bhyt_employee(gross_salary)
    bhtn = calculate_bhtn_employee(gross_salary)
    total_insurance = bhxh + bhyt + bhtn

    assessable = gross_salary + other_allowances - total_insurance
    deduction = _PERSONAL_DEDUCTION + (dependents * _DEPENDENT_DEDUCTION)
    taxable_income = max(assessable - deduction, 0.0)
    pit = calculate_pit(gross_salary, dependents)
    net = gross_salary + other_allowances - total_insurance - pit

    return {
        "gross": gross_salary,
        "bhxh_employee": bhxh,
        "bhyt_employee": bhyt,
        "bhtn_employee": bhtn,
        "total_insurance_employee": total_insurance,
        "personal_deduction": _PERSONAL_DEDUCTION,
        "dependent_deduction": dependents * _DEPENDENT_DEDUCTION,
        "taxable_income": taxable_income,
        "pit_amount": pit,
        "net": net,
    }
