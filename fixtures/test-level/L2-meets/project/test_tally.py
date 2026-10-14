import io
import unittest
from contextlib import redirect_stdout
from unittest import mock

import tally


class TotalByCategory(unittest.TestCase):
    def test_sums_each_category(self):
        rows = [{"category": "food", "amount": "12.50"},
                {"category": "rent", "amount": "800"},
                {"category": "food", "amount": "7.25"}]
        self.assertEqual(tally.total_by_category(rows), {"food": 19.75, "rent": 800.0})

    def test_ignores_case_and_spaces(self):
        rows = [{"category": "Food", "amount": "1"},
                {"category": " food ", "amount": "2"}]
        self.assertEqual(tally.total_by_category(rows), {"food": 3.0})

    def test_no_float_drift(self):
        rows = [{"category": "x", "amount": "0.10"}] * 3
        self.assertEqual(tally.total_by_category(rows), {"x": 0.3})

    def test_empty(self):
        self.assertEqual(tally.total_by_category([]), {})


class Main(unittest.TestCase):
    def run_main(self, argv, env=None):
        out = io.StringIO()
        with mock.patch.dict("os.environ", env or {}, clear=True), redirect_stdout(out):
            code = tally.main(argv)
        return code, out.getvalue()

    def test_prints_sample_totals(self):
        code, out = self.run_main(["tally.py", "sample.csv"])
        self.assertEqual(code, 0)
        self.assertEqual(out, "food: 19.75 USD\nrent: 800.00 USD\ntravel: 40.10 USD\n")

    def test_currency_variable(self):
        _, out = self.run_main(["tally.py", "sample.csv"], {"TALLY_CURRENCY": "EUR"})
        self.assertIn("food: 19.75 EUR", out)


if __name__ == "__main__":
    unittest.main()
