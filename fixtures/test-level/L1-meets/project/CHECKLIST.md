# Manual checks

Run these by hand before every change.

1. `python3 tally.py sample.csv` prints three lines: `food: 19.75 USD`, `rent: 800.00 USD`, `travel: 40.10 USD`.
2. `TALLY_CURRENCY=EUR python3 tally.py sample.csv` prints the same totals with `EUR`.
3. `python3 tally.py` with no file prints the usage line and exits with status 2.
