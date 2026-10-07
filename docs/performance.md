# Performance

## Method

- Data: the seeded database with 10,000 employees.
- Machine: one developer laptop. The API and the client are on the same machine. The times change with the machine.
- Each request ran 30 times. The table shows the median and the 95th percentile.

## Results

| Request | Median | 95th percentile | Requirement |
|---|---|---|---|
| Employee list, page 1 | 4 ms | 6 ms | NFR-01: less than 300 ms |
| Employee list, page 400 | 4 ms | 6 ms | NFR-01 |
| Employee list, search by name | 13 ms | 21 ms | NFR-01 |
| Employee list, 3 filters and sort by name | 9 ms | 11 ms | NFR-01 |
| Employee detail | 3 ms | 5 ms | NFR-01 |
| Salary bands | 4 ms | 4 ms | NFR-01 |
| Employee list, 100 rows on a page | 2 ms | 4 ms | NFR-01 |
| Pay health, list of all outliers | 10 ms | 15 ms | NFR-01 |
| Pay health, list with a search | 18 ms | 19 ms | NFR-01 |
| Pay overview, by country | 53 ms | 55 ms | NFR-02: less than 500 ms |
| Pay overview, by department | 55 ms | 58 ms | NFR-02 |
| Pay overview, by job level | 50 ms | 51 ms | NFR-02 |
| Pay health, summary | 9 ms | 10 ms | NFR-02 |
| Pay figures of the employee list, no filter | 34 ms | 38 ms | NFR-02 |
| Pay figures of the employee list, 2 filters | 7 ms | 8 ms | NFR-02 |

| Task | Time | Requirement |
|---|---|---|
| Seed script, 10,000 employees | 0.5 seconds | NFR-03: less than 30 seconds |
| Backend tests, 203 tests | 5 seconds | NFR-05: less than 10 seconds |
| Backend unit tests only, 50 tests | less than 1 second | NFR-05 |
| UI tests, 139 tests | 9 to 10 seconds | See the note below |

The system satisfies the requirements, with one limit. The UI tests are component tests: each test renders a screen in a simulated browser. They take 9 to 10 seconds on a machine that does other work. This is at the limit of NFR-05. The pure unit tests of the UI (`src/lib`) and of the backend complete in less than 1 second.

## Why it is fast

- **Pagination in SQL.** A list request reads 25 rows with `LIMIT` and `OFFSET`.
- **Aggregation in SQL.** An insight returns one row for each group. The API does not load 10,000 employees into Python.
- **Indexes.** `employees` has indexes on `country`, `department`, `job_level` and `status`. `salary_changes` has an index on `employee_id`.
- **Bulk insert in the seed script.** One statement inserts all rows of a table.

## Limits

- **Search.** A search for a part of a name reads all rows (`LIKE '%text%'`). This takes 13 ms for 10,000 rows. For 1,000,000 rows, use a full-text index.
- **Median.** The median query sorts the salaries of each group. This is the most expensive part of the overview. The overview runs it 2 times: for the groups and for the organization.
- **Deep pages.** `OFFSET` reads the rows that it skips. This is not a problem for 400 pages. For millions of rows, use keyset pagination.
- **No cache.** The system calculates each insight on each request. If the data grows by 100 times, add a cache that a salary change clears.
