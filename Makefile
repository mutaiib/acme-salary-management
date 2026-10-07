.PHONY: install seed test lint build start dev-api dev-ui

install:  ## Install the backend and the UI dependencies
	cd backend && uv sync
	cd frontend && npm ci

seed:  ## Create the database with 10,000 employees
	cd backend && uv run python -m app.seed

test:  ## Run all tests
	cd backend && uv run pytest -q
	cd frontend && npm test

lint:  ## Check the code style
	cd backend && uv run ruff check . && uv run ruff format --check .
	cd frontend && npm run lint

build:  ## Build the UI
	cd frontend && npm run build

start: install seed build  ## Install, seed and start the system at http://localhost:8000
	cd backend && uv run uvicorn app.main:app --port 8000

dev-api:  ## Start the API with reload
	cd backend && uv run uvicorn app.main:app --port 8000 --reload

dev-ui:  ## Start the UI with reload at http://localhost:5173
	cd frontend && npm run dev
