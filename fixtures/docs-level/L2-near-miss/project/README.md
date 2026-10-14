# tally

tally adds up the amounts in a CSV file of expenses and prints a total for each category.

It is for one person who keeps their spending in a spreadsheet and wants quick totals without opening it.

## Install

You need Python 3.8 or later. There is nothing else to install.

## Run

```
python3 tally.py sample.csv
```

Output:

```
food: 19.75 USD
rent: 800.00 USD
travel: 40.10 USD
```

## Input file

The file must be a CSV with a header row. tally reads two columns:

- `category`: any text. Case and surrounding spaces are ignored, so `Food` and ` food` count as one category.
- `amount`: a number with a dot as the decimal separator, such as `12.50`. Do not include a currency sign.

Other columns are ignored.

## Common tasks

Totals for one month: filter the rows in your spreadsheet first, export them to a new CSV, and run tally on that file.

Save the totals to a file:

```
python3 tally.py sample.csv > totals.txt
```

## Known problems

- `KeyError: 'category'`: the header row is missing or the column has another name. Rename the column to `category`.
- `ValueError: could not convert string to float`: an amount contains a currency sign or a comma. Remove it in the spreadsheet and export again.
