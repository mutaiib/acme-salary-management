# ACME Salary Management

Salary management software for the HR Manager of ACME: 10,000 employees in 8 countries.

The application follows one sequence:

1. **See** the pay: payroll cost and headcount by country, department and job level.
2. **Find** the problems: salaries outside the salary band, and the gender pay gap.
3. **Correct** a salary, with a reason and an effective date.
4. **Prove** the change: each employee has a salary history.

- Live application: _add the URL after the deployment_
- Video demo: _add the link_

## Start

You need Python 3.12 or later with [uv](https://docs.astral.sh/uv/), and Node.js 22.

```
make start
```

This command installs the dependencies, creates the database with 10,000 employees, builds the UI, and starts the system. Open http://localhost:8000.

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
| Pay overview | What does ACME spend on salaries, and where? |
| Pay health | Who has a salary below or above the salary band? What does the correction cost? |
| Pay equity | Do men and women have different pay? In which countries? |
| Employees | Who is this employee, and what is the salary history? |
| Salary bands | What is the pay range for a job level in a country? |

## Technology

- Backend: Python, FastAPI, SQLAlchemy, SQLite.
- UI: React 19, TypeScript, Vite, and the [Astryx](https://astryx.atmeta.com/) design system.
- Tests: pytest (153 tests), Vitest with React Testing Library (61 tests).

## Structure

```
backend/app/
  calculations/   pure pay calculations: money, salary bands, pay gap
  services/       use cases and database queries
  routers/        HTTP endpoints
  seed.py         creates the 10,000 employees
frontend/src/
  components/     shared component library, built from Astryx components
  pages/          one directory for each screen
  api/            typed API client
docs/             requirements, design notes and decisions
```

## Documents

| Document | Content |
|---|---|
| [docs/requirements.md](docs/requirements.md) | Goal, scope, and the features that are left out |
| [docs/glossary.md](docs/glossary.md) | The pay terms and the formulas |
| [docs/architecture.md](docs/architecture.md) | Diagram and main decisions |
| [docs/tradeoffs.md](docs/tradeoffs.md) | The choices and their cost |
| [docs/performance.md](docs/performance.md) | Measured response times |
| [docs/traceability.md](docs/traceability.md) | Each requirement, with its slice and its tests |
| [docs/ai-usage.md](docs/ai-usage.md) | The AI tools, the prompts, and the corrections |
| [docs/specs/](docs/specs/) and [docs/plans/](docs/plans/) | Discovery, specification and plan |
| [CLAUDE.md](CLAUDE.md) | The constitution: the rules for all work in this repository |

## Method

The work follows the workflow of [Bee](https://github.com/incubyte/ai-plugins/tree/main/bee), the Claude Code plugin of Incubyte: discovery, specification, plan, then vertical slices with the tests first. The documents use ASD-STE100 Simplified Technical English.
