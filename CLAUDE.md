# Constitution

This document governs all work in this repository. It applies to people and to AI agents. If a task conflicts with an article, stop. Tell the developer.

The product is salary management software for the HR Manager of ACME. Read `docs/requirements.md` for the scope and `docs/glossary.md` for the terms.

## Article 1: Engineering

1. Write the test first. Make sure that the test fails. Then write the code.
2. Build in vertical slices. Each slice gives the HR Manager one capability through the API and the UI.
3. In each slice, complete the backend step before the UI step.
4. Make one commit for each green step. Do not commit code with a test that fails.
5. Do not write code without a requirement ID (`FR-nn` or `NFR-nn`). Each test file names the requirements that it checks.
6. Do not add a feature that is not in `docs/requirements.md`.
7. Do not add an abstraction before a second implementation exists.
8. Keep money as an integer in minor units. Do not use floating-point numbers for money.
9. Do pagination and aggregation in the database.
10. Keep the pay calculations in pure functions. A pure function does not read the database, the network or the clock.
11. A test name must describe the scenario, for example `refuses_a_salary_of_zero`.
12. A unit test must not use the network, the system clock or shared database state.

## Article 2: Structure

```
backend/app/
  main.py         creates the application; serves the built UI
  routers/        HTTP only: parse the request, call a service, shape the response
    deps.py           the clock as an input: get_today, get_now
    error_handlers.py turns the errors of the services into HTTP responses
  services/       use cases and database queries
    sql.py            shared SQL: active employees, currency conversion, median
    pagination.py     one page of a list
  calculations/   pure pay calculations: money, salary bands, pay gap, salary change rules
  models.py       database tables
  schemas.py      request and response shapes
  reference.py    countries, currencies, jobs, and the allowed values of a status or a gender
  errors.py       DomainError, NotFoundError
  seed.py         creates the 10,000 employees
backend/tests/
  unit/           pure functions; no database
  api/            the API on a new in-memory database for each test
frontend/src/
  components/     shared component library, built from Astryx components
  pages/          one directory for each screen; a test file is next to its source file
  api/            typed API client; types.ts has the same shapes as backend/app/schemas.py
  hooks/          shared React hooks
  lib/            formats and small pure functions
  test/           test helpers: stubApi, renderScreen, data builders
```

- A router must not query the database.
- A service must not import from a router.
- The `calculations` package must not import from other application packages.

Patterns to follow. Read `docs/architecture.md` for the reasons.

- **Money.** An amount is an integer in minor units, and its name ends with `_minor`. An exchange rate ends with `_micro`. A percentage ends with `_pct`. A half rounds up.
- **Clock.** A service gets `today` and `now` as arguments. A router gets them from `routers/deps.py`. Do not call `date.today()` or `datetime.now()` in a service.
- **Errors.** A service raises `DomainError(field, cause)` or `NotFoundError`. The API returns `422 {"detail": [{"field", "cause"}]}` or `404`. A business rule goes into a pure function in `calculations/`, as `validate_band` does.
- **Insights.** Use `active_employees_with_rate` from `services/sql.py`, so that all insights count the same employees.
- **A screen.** Load data with `useApi` and show it with `DataState`. Keep list filters in the address with `useUrlFilters`. Write data with `useSubmit` in a `FormDialog`.
- **A screen test.** Replace the API with `stubApi`, and render with `renderScreen`.
- **API shapes.** Change `backend/app/schemas.py` and `frontend/src/api/types.ts` together.
- **Traceability.** Start a new test file with the requirement IDs. Add the file to `docs/traceability.md`.

## Article 3: Writing standard

Write requirements, specifications, plans, design notes and the README in ASD-STE100 Simplified Technical English.

1. Use one word for one meaning. Use the terms in `docs/glossary.md`. Do not use a synonym.
2. A sentence that gives an instruction has a maximum of 20 words.
3. A sentence that gives a description has a maximum of 25 words.
4. A paragraph has a maximum of 6 sentences.
5. Use the active voice.
6. Use the simple present, simple past or simple future tense.
7. Give one instruction in each sentence.
8. A noun cluster has a maximum of 3 words.
9. Keep the articles (`a`, `an`, `the`).
10. Do not use the `-ing` form of a verb, unless it is part of a technical name.
11. Use `must` for a requirement. Do not use `shall`, `should` or `may` for a requirement.
12. Use a vertical list for a sequence of more than 2 items.

Code comments and commit messages follow the same rules where practical.

## Article 4: UI standard

1. Use Astryx components (`@astryxdesign/core`) for all UI elements.
2. Use Astryx theme tokens for color, space and type. Do not write a color value by hand.
3. Read the component documentation before you use a component. Article 5 gives the command.
4. Put a UI element that 2 or more screens use in the shared component library (`frontend/src/components/`). A screen must not copy it.
5. Each screen must have a loading state, an empty state and an error state.
6. Each screen must be usable with a keyboard.

## Article 5: Commands

Run these commands from the root of the repository.

| Command | Result |
|---|---|
| `make start` | Install, seed, build and start the system at http://localhost:8000 |
| `make seed` | Create the database again with the same 10,000 employees |
| `make test` | Run the backend tests and the UI tests |
| `make lint` | Check the code style |
| `make dev-api`, `make dev-ui` | Start the API and the UI with reload |

To run one test file:

```
cd backend && uv run pytest tests/unit/test_money.py -q
cd frontend && npx vitest run src/lib/format.test.ts
```

To read the documentation of an Astryx component:

```
cd frontend && npm run astryx -- component Table
```
