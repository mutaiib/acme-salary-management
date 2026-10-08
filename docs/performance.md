# Performance

## Method

- Data: the seeded database with 10,000 employees.
- Machine: one developer laptop. The API and the client are on the same machine. The times change with the machine.
- Each request ran 30 times, after one request that the measurement does not count. The table shows the median and the 95th percentile.
- The rows of the second iteration come from a later run, in a test client with no network.

## Results

| Request | Median | 95th percentile | Requirement |
|---|---|---|---|
| Employee list, page 1 | 2 ms | 2 ms | NFR-01: less than 300 ms |
| Employee list, page 1,000 (the last page) | 2 ms | 2 ms | NFR-01 |
| Employee list, search by name | 8 ms | 9 ms | NFR-01 |
| Employee list, 3 filters and sort by name | 3 ms | 4 ms | NFR-01 |
| Employee list, 100 rows on a page | 2 ms | 2 ms | NFR-01 |
| Employee detail | 1 ms | 1 ms | NFR-01 |
| Salary bands, with the figures of each band | 20 ms | 27 ms | NFR-01 |
| Exchange rates | 1 ms | 1 ms | NFR-01 |
| Pay health, list of all outliers | 9 ms | 10 ms | NFR-01 |
| Pay health, list with a search | 15 ms | 18 ms | NFR-01 |
| Pay overview, by country | 51 ms | 54 ms | NFR-02: less than 500 ms |
| Pay overview, by department | 53 ms | 56 ms | NFR-02 |
| Pay overview, by job level | 47 ms | 54 ms | NFR-02 |
| Pay health, summary | 9 ms | 16 ms | NFR-02 |
| Pay figures of the employee list, no filter | 32 ms | 34 ms | NFR-02 |
| Pay figures of the employee list, 2 filters | 4 ms | 5 ms | NFR-02 |
| Preview of a band change | 10 ms | 12 ms | NFR-02 |
| Salary distribution | 16 ms | 23 ms | NFR-02 |
| Outliers by country | 13 ms | 15 ms | NFR-02 |
| Outliers by department | 14 ms | 18 ms | NFR-02 |
| Outliers by job level | 14 ms | 18 ms | NFR-02 |
| Highest salaries, organization | 11 ms | 18 ms | NFR-02 |
| Highest salaries, one country | 8 ms | 9 ms | NFR-02 |
| Employee list, with a salary bracket | 16 ms | 23 ms | NFR-01 |
| Pay figures of the employee list, with a salary bracket | 27 ms | 33 ms | NFR-02 |
| Pay health, list with a department | 15 ms | 23 ms | NFR-01 |

| Task | Time | Requirement |
|---|---|---|
| Seed script, 10,000 employees | 0.5 seconds | NFR-03: less than 30 seconds |
| Backend tests, 269 tests | 6 seconds | NFR-05: less than 10 seconds |
| Backend unit tests only, 61 tests | less than 1 second | NFR-05 |
| UI tests, 280 tests | 11 to 15 seconds | See the note below |

The system satisfies the requirements, with one limit. The UI tests are component tests: each test renders a screen in a simulated browser. They take 11 to 15 seconds. A query that waits for the screen has a limit of 3 seconds. A test has a limit of 15 seconds. A busy machine then does not fail a correct test. This is at the limit of NFR-05. The pure unit tests of the UI (`src/lib`) and of the backend complete in less than 1 second.

## Why it is fast

- **Pagination in SQL.** A list request reads 10 rows with `LIMIT` and `OFFSET`.
- **Aggregation in SQL.** An insight returns one row for each group. The API does not load 10,000 employees into Python.
- **Indexes.** `employees` has indexes on `country`, `department`, `job_level` and `status`. `salary_changes` has an index on `employee_id`.
- **Bulk insert in the seed script.** One statement inserts all rows of a table.

## Limits

- **Size of the UI.** Recharts makes the built script larger than 500 kB, and the build tool gives a warning. The system loads it one time. To make the first load smaller, load the charts only when a screen shows one.
- **Search.** A search for a part of a name reads all rows (`LIKE '%text%'`). This takes 8 ms for 10,000 rows. For 1,000,000 rows, use a full-text index.
- **Median.** The median query sorts the salaries of each group. This is the most expensive part of the overview. The overview runs it 2 times: for the groups and for the organization.
- **Deep pages.** `OFFSET` reads the rows that it skips. This is not a problem for 1,000 pages. For millions of rows, use keyset pagination.
- **No cache.** The system calculates each insight on each request. If the data grows by 100 times, add a cache that a salary change clears.
