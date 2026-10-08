# ACME Salary Management

Salary management software for the HR Manager of ACME: 10,000 employees in 8 countries.

The system follows this sequence:

1. **See** the pay: payroll cost, headcount and median salary, by country, department and job level.
2. **Find** the problems: salaries outside the salary band.
3. **Change** a salary, with a reason and an effective date.
4. **Prove** the salary change: each employee has a salary history.

A second iteration added the Pay analysis screen (2 charts and the 10 highest salaries), and the effect of a band change before the save. A bar of a chart opens the list of its employees. `docs/ai-usage.md`, Part 5, tells why.

- Live application: https://acme-salary-management-ds2v.onrender.com
- Video demo: https://youtu.be/5bzqguBkGIc

The live application runs on a free instance. The instance stops when no person uses it, so the first request can take up to 1 minute. A restart of the instance gives the seeded data again.

## Start

You need Python 3.12 or later with [uv](https://docs.astral.sh/uv/), and Node.js 22.

```
make start
```

This command does 4 steps:

1. It installs the dependencies.
2. It creates the database with 10,000 employees.
3. It builds the UI.
4. It starts the system.

Then open http://localhost:8000.

| Command | Result |
|---|---|
| `make start` | Install, seed, build and start |
| `make seed` | Create the database again with the same 10,000 employees |
| `make test` | Run the backend tests and the UI tests |
| `make lint` | Check the code style |
| `make dev-api` and `make dev-ui` | Start the API and the UI with reload, for development |

The API documentation is at http://localhost:8000/docs.

## Screens

| Screen | Question that it answers |
|---|---|
| Welcome | What is this system for? The first screen states the problem and what the system can do. |
| Pay overview | What does ACME spend on salaries, and where? |
| Pay health | Who has a salary below or above the salary band? What does the correction cost? |
| Pay analysis | How many employees are in each salary bracket? Which country, department or job level has the most outliers? Who has the highest salary, in ACME or in one country? |
| Employees | What does ACME pay a group of employees, for example Engineering in Germany? Who is this employee, and what is the salary history? |
| Salary bands | What is the pay range for a job level in a country? How many employees does a band have, and how many are outside it? What does a band change do, before the save? |
| Exchange rates | Which rates convert a salary to USD? The Pay overview links to this screen. |

## Technology

- Backend: Python, FastAPI, SQLAlchemy, SQLite.
- UI: React 19, TypeScript, Vite, and the [Astryx](https://astryx.atmeta.com/) design system. Recharts draws the 2 charts, with the colors of the Astryx theme.
- Tests: pytest (269 tests), Vitest with React Testing Library (280 tests).

## Structure

```
backend/app/
  calculations/   pure pay calculations: money, salary bands, salary change rules
  services/       use cases and database queries
  routers/        HTTP endpoints
  seed.py         creates the 10,000 employees
frontend/src/
  components/     shared component library, built from Astryx components
  themes/         the Astryx neutral theme as source; `theme.ts` gives it a blue accent
  pages/          one directory for each screen
  api/            typed API client
  hooks/, lib/    shared hooks, formats and small pure functions
docs/             requirements, design notes and decisions
```

## Documents

| Document | Content |
|---|---|
| [docs/requirements.md](docs/requirements.md) | Goal, scope, and the features that the product leaves out |
| [docs/glossary.md](docs/glossary.md) | The pay terms and the formulas |
| [docs/architecture.md](docs/architecture.md) | Diagram and main decisions |
| [docs/tradeoffs.md](docs/tradeoffs.md) | The choices and their cost, and the decisions that changed after the first version |
| [docs/performance.md](docs/performance.md) | Measured response times |
| [docs/traceability.md](docs/traceability.md) | Each requirement, with its slice and its tests |
| [docs/ai-usage.md](docs/ai-usage.md) | How the developer used AI: the requests, the decisions, and the errors in the AI output that the work found |
| [docs/specs/](docs/specs/) and [docs/plans/](docs/plans/) | Discovery, specification and plan, and the check of the brief in a browser |
| [.claude/DESIGN.md](.claude/DESIGN.md) | The design brief for the screens |
| [CLAUDE.md](CLAUDE.md) | The constitution: the rules for all work in this repository |

## Method

The work follows the workflow of [Bee](https://github.com/incubyte/ai-plugins/tree/main/bee), the Claude Code plugin of Incubyte:

1. Discovery
2. Specification
3. Plan
4. Vertical slices, with the tests first for most steps (`docs/ai-usage.md` lists the exceptions)
5. Review

The documents use the writing rules of ASD-STE100 Simplified Technical English.
