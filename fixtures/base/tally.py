"""Sum the amounts in a CSV file by category."""
import csv
import os
import sys


def total_by_category(rows):
    """Return {category: total} with categories lower-cased and sorted."""
    cents = {}
    for row in rows:
        category = row["category"].strip().lower()
        cents[category] = cents.get(category, 0) + round(float(row["amount"]) * 100)
    return {category: value / 100 for category, value in sorted(cents.items())}


def main(argv):
    if len(argv) != 2:
        print("usage: python3 tally.py FILE.csv", file=sys.stderr)
        return 2
    with open(argv[1], newline="") as f:
        totals = total_by_category(csv.DictReader(f))
    currency = os.environ.get("TALLY_CURRENCY", "USD")
    for category, amount in totals.items():
        print(f"{category}: {amount:.2f} {currency}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
