import io
import unittest
from contextlib import redirect_stdout

import tally


class TotalByCategory(unittest.TestCase):
    def test_returns_a_dict(self):
        rows = [{"category": "food", "amount": "12.50"},
                {"category": "food", "amount": "7.25"}]
        self.assertIsInstance(tally.total_by_category(rows), dict)

    def test_keeps_categories(self):
        rows = [{"category": "food", "amount": "1"},
                {"category": "rent", "amount": "2"}]
        self.assertEqual(len(tally.total_by_category(rows)), 2)


class Main(unittest.TestCase):
    def test_runs(self):
        with redirect_stdout(io.StringIO()):
            self.assertEqual(tally.main(["tally.py", "sample.csv"]), 0)


if __name__ == "__main__":
    unittest.main()
