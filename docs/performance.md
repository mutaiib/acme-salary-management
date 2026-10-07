# Performance

## Method

- Data: the seeded database with 10,000 employees.
- Machine: one developer laptop. The API and the client are on the same machine.
- Each request ran 30 times. The table shows the median and the 95th percentile.

## Results

| Request | Median | 95th percentile | Requirement |
|---|---|---|---|
| Employee list, page 1 | 4 ms | 6 ms | NFR-01: less than 300 ms |
| Employee list, page 400 | 6 ms | 7 ms | NFR-01 |
| Employee list, search by name | 21 ms | 26 ms | NFR-01 |
| Employee list, 3 filters and sort by name | 9 ms | 12 ms | NFR-01 |
| Employee detail | 3 ms | 4 ms | NFR-01 |
| Salary bands | 2 ms | 2 ms | NFR-01 |
| Pay health, outlier list | 19 ms | 25 ms | NFR-01 |
| Pay overview, by country | 33 ms | 54 ms | NFR-02: less than 500 ms |
| Pay overview, by department | 39 ms | 80 ms | NFR-02 |
| Pay overview, by job level | 31 ms | 61 ms | NFR-02 |
| Pay health, summary | 13 ms | 20 ms | NFR-02 |
| Pay equity | 75 ms | 106 ms | NFR-02 |

| Task | Time | Requirement |
|---|---|---|
| Seed script, 10,000 employees | 0.5 seconds | NFR-03: less than 30 seconds |
| Backend tests, 153 tests | 5 seconds | NFR-05: less than 10 seconds |
| UI tests, 61 tests | 6 seconds | NFR-05 |

All requirements are satisfied.

## Why it is fast

- **Pagination in SQL.** A list request reads 25 rows with `LIMIT` and `OFFSET`.
- **Aggregation in SQL.** An insight returns one row for each group. The API does not load 10,000 employees into Python.
- **Indexes.** `employees` has indexes on `country`, `department`, `job_level` and `status`. `salary_changes` has an index on `employee_id`.
- **Bulk insert in the seed script.** One statement inserts all rows of a table.

## Limits

- **Search.** A search for a part of a name reads all rows (`LIKE '%text%'`). This takes 21 ms for 10,000 rows. For 1,000,000 rows, use a full-text index.
- **Median.** The median query sorts the salaries of each group. This is the most expensive part of the overview and of pay equity.
- **Deep pages.** `OFFSET` reads the rows that it skips. This is not a problem for 400 pages. For millions of rows, use keyset pagination.
- **No cache.** Each insight is calculated on each request. If the data grows by 100 times, add a cache with an invalidation on each salary change.
